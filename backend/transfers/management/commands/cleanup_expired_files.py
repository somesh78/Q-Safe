from django.core.management.base import BaseCommand
from django.utils.timezone import now
from transfers.models import OnlineEncryptedFile

class Command(BaseCommand):
    help = 'Cleans up expired OnlineEncryptedFile records from the database.'

    def handle(self, *args, **kwargs):
        expired_files = OnlineEncryptedFile.objects.filter(expires_at__lt=now())
        count = expired_files.count()
        expired_files.delete()
        self.stdout.write(f'Successfully deleted {count} expired OnlineEncryptedFile records.')