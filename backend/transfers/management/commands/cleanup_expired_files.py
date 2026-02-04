from django.core.management.base import BaseCommand
from django.utils.timezone import now
from transfers.models import OnlineEncryptedFile
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Cleans up expired OnlineEncryptedFile records from the database and Supabase Storage.'

    def handle(self, *args, **kwargs):
        expired_files = OnlineEncryptedFile.objects.filter(expires_at__lt=now())
        count = expired_files.count()
        
        if count == 0:
            self.stdout.write('No expired files to clean up.')
            return
        
        # Try to delete files from Supabase Storage if configured
        deleted_from_storage = 0
        try:
            from transfers.services.storage import get_storage
            storage = get_storage()
            
            for file in expired_files:
                if file.file_path:  # Only delete if using Supabase Storage
                    try:
                        storage.delete_file(file.file_path)
                        deleted_from_storage += 1
                    except Exception as e:
                        logger.error(f"Failed to delete {file.file_path} from Supabase: {e}")
        except Exception as e:
            logger.warning(f"Supabase Storage not configured or error: {e}")
        
        # Delete database records
        expired_files.delete()
        
        if deleted_from_storage > 0:
            self.stdout.write(
                f'Successfully deleted {count} expired file records. '
                f'{deleted_from_storage} files removed from Supabase Storage.'
            )
        else:
            self.stdout.write(f'Successfully deleted {count} expired file records.')