"""
Supabase Storage Service for Q_Safe
Handles file upload, download, and deletion from Supabase Storage
"""
import os
import logging
import httpx
from supabase import create_client, Client
from decouple import config

logger = logging.getLogger(__name__)

class SupabaseStorage:
    """Wrapper for Supabase Storage operations"""
    
    def __init__(self):
        supabase_url = config('SUPABASE_URL', default='')
        supabase_key = config('SUPABASE_SERVICE_KEY', default='')  # Use service_role key for server-side
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment")
        
        self.supabase_url = supabase_url.rstrip('/')
        self.client: Client = create_client(supabase_url, supabase_key)
        self.bucket_name = config('SUPABASE_BUCKET', default='encrypted-files')
    
    def upload_file(self, file_path: str, file_data: bytes) -> str:
        """
        Upload encrypted file to Supabase Storage
        
        Args:
            file_path: Path in the bucket (e.g., 'abc-123-def.enc')
            file_data: Encrypted file bytes
            
        Returns:
            str: Full path to uploaded file
        """
        try:
            result = self.client.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_data,
                file_options={"content-type": "application/octet-stream"}
            )
            logger.info(f"Uploaded file to Supabase Storage: {file_path}")
            return file_path
        except Exception as e:
            logger.error(f"Failed to upload file to Supabase: {e}")
            raise
    
    def download_file(self, file_path: str) -> bytes:
        """
        Download encrypted file from Supabase Storage
        
        Args:
            file_path: Path in the bucket
            
        Returns:
            bytes: File data
        """
        try:
            result = self.client.storage.from_(self.bucket_name).download(file_path)
            logger.info(f"Downloaded file from Supabase Storage: {file_path}")
            return result
        except Exception as e:
            logger.error(f"Failed to download file from Supabase: {e}")
            raise
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete file from Supabase Storage
        
        Args:
            file_path: Path in the bucket
            
        Returns:
            bool: True if deleted successfully
        """
        try:
            self.client.storage.from_(self.bucket_name).remove([file_path])
            logger.info(f"Deleted file from Supabase Storage: {file_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete file from Supabase: {e}")
            return False

    def open_download_stream(self, file_path: str, expires_seconds: int = 600):
        """
        Open a streamed HTTP response for a storage object using a signed URL.

        Returns:
            httpx stream context manager. Call __enter__ / __exit__ in caller.
        """
        try:
            signed = self.client.storage.from_(self.bucket_name).create_signed_url(file_path, expires_seconds)
            signed_url = signed.get('signedURL') or signed.get('signed_url')
            if not signed_url:
                raise ValueError("Failed to create signed URL for file stream")

            if signed_url.startswith('/'):
                signed_url = f"{self.supabase_url}{signed_url}"

            logger.info(f"Opened streamed download for Supabase file: {file_path}")
            return httpx.stream("GET", signed_url, timeout=300.0, follow_redirects=True)
        except Exception as e:
            logger.error(f"Failed to open download stream from Supabase: {e}")
            raise
    
    def file_exists(self, file_path: str) -> bool:
        """
        Check if file exists in Supabase Storage
        
        Args:
            file_path: Path in the bucket
            
        Returns:
            bool: True if file exists
        """
        try:
            # Try to get file info
            self.client.storage.from_(self.bucket_name).list(file_path)
            return True
        except Exception as e:
            logger.debug(f"File exists check failed: {e}")
            return False


# Singleton instance
_storage = None

def get_storage() -> SupabaseStorage:
    """Get or create Supabase Storage instance"""
    global _storage
    if _storage is None:
        _storage = SupabaseStorage()
    return _storage
