"""
Celery tasks for async processing
"""
import io
import json
import logging
import hashlib
import uuid
from datetime import datetime
from celery import shared_task
from django.contrib.auth.models import User
from django.utils import timezone

from .models import UploadSession, OfflineJob
from .services.chunking import chunk_bytes
from .services.qr_generator import generate_qr
from .services.zipper import create_zip

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def generate_offline_qr_codes(self, session_id, user_id):
    """
    Async task to generate QR codes for offline mode
    
    Args:
        session_id: Upload session UUID
        user_id: User ID
    """
    job = None
    try:
        # Get the session and user
        session = UploadSession.objects.get(session_id=session_id)
        user = User.objects.get(id=user_id)
        
        # Get or create the job
        job, created = OfflineJob.objects.get_or_create(
            session=session,
            defaults={
                'user': user,
                'original_filename': session.original_filename,
                'status': 'PROCESSING'
            }
        )
        
        if not created:
            job.status = 'PROCESSING'
            job.save()
        
        # Get uploaded file chunks (these are already encrypted)
        uploaded_files = session.files.all().order_by('chunk_index')
        if not uploaded_files:
            raise Exception("No files found for session")
        
        # Combine chunks - this is the encrypted data
        encrypted_data = b''.join([uf.chunk_data for uf in uploaded_files])
        
        logger.info(f"Processing job {job.job_id}: {len(encrypted_data)} bytes, filename: {session.original_filename}")
        
        # Create chunks for QR codes (from encrypted data)
        chunks = chunk_bytes(encrypted_data)
        job.total_chunks = len(chunks)
        job.save()
        
        logger.info(f"Job {job.job_id}: Created {len(chunks)} chunks for QR generation")
        
        # Calculate checksum for integrity verification
        checksum = hashlib.sha256(encrypted_data).hexdigest()
        file_id = str(uuid.uuid4())
        
        # Prepare QR images list
        qr_images = []
        
        # Add metadata as first file
        metadata = {
            "original_filename": session.original_filename,
            "file_id": file_id,
            "total_chunks": len(chunks),
            "checksum": checksum
        }
        qr_images.append(("metadata.json", json.dumps(metadata).encode("utf-8")))
        
        # Generate QR codes with progress tracking
        for i, chunk in enumerate(chunks):
            payload = {
                "file_id": file_id,
                "index": chunk["index"],
                "total": chunk["total"],
                "data": chunk["data"]
            }
            qr_png = generate_qr(payload)
            filename = f"qr_{chunk['index']:03}.png"
            qr_images.append((filename, qr_png))
            
            # Update progress every 100 chunks or on last chunk
            if (i + 1) % 100 == 0 or (i + 1) == len(chunks):
                job.processed_chunks = i + 1
                job.save()
                
                # Update Celery task state for frontend progress tracking
                self.update_state(
                    state='PROCESSING',
                    meta={
                        'current': i + 1,
                        'total': len(chunks),
                        'percent': int(((i + 1) / len(chunks)) * 100)
                    }
                )
                
                logger.info(f"Job {job.job_id}: Processed {i + 1}/{len(chunks)} chunks ({int(((i + 1) / len(chunks)) * 100)}%)")
        
        # Create ZIP file
        logger.info(f"Job {job.job_id}: Creating ZIP with {len(qr_images)} files")
        zip_buffer = create_zip(qr_images)
        
        # Store result
        job.result_file = zip_buffer
        job.status = 'COMPLETED'
        job.completed_at = timezone.now()
        job.save()
        
        logger.info(f"Job {job.job_id}: Completed successfully, ZIP size: {len(job.result_file)} bytes")
        
        return {
            'status': 'COMPLETED',
            'job_id': str(job.job_id),
            'total_chunks': len(chunks),
            'zip_size': len(job.result_file)
        }
        
    except Exception as e:
        logger.error(f"Job failed: {str(e)}", exc_info=True)
        
        if job:
            job.status = 'FAILED'
            job.error_message = str(e)
            job.completed_at = timezone.now()
            job.save()
        
        # Re-raise for Celery to mark task as failed
        raise

@shared_task
def cleanup_expired_files():
    from .models import OnlineEncryptedFile
    from django.utils import timezone
    expired = OnlineEncryptedFile.objects.filter(expires_at__lt=timezone.now())
    for f in expired:
        try:
            # Delete from Supabase storage
            from supabase import create_client, Client
            from django.conf import settings
            supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            supabase.storage.from_('uploads').remove([f.storage_path])
        except Exception:
            pass
        f.delete()
    return f"Cleaned up {expired.count()} expired files"
