import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User

def default_expiry():
    return timezone.now() + timedelta(hours=1)


# Create your models here.
class UploadSession(models.Model):
    MODE_CHOICES = (
        ('ONLINE', 'Online'),
        ('OFFLINE', 'Offline')
    )
    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    mode = models.CharField(max_length=10, choices=MODE_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class UploadedFile(models.Model):
    session = models.OneToOneField(UploadSession, on_delete=models.CASCADE, related_name='uploaded_file')
    original_filename = models.CharField(max_length=255)
    size = models.IntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

class OnlineEncryptedFile(models.Model):
    session = models.OneToOneField(UploadSession, on_delete=models.CASCADE, related_name='online_encrypted')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    encrypted_data = models.BinaryField()
    original_filename = models.CharField(max_length=255)

    expires_at = models.DateTimeField(default=default_expiry)
    download_count = models.IntegerField(default=0)

    failed_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    enable_ip_lock = models.BooleanField(default=False)
    allowed_ip = models.GenericIPAddressField(null=True, blank=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)

class DownloadAudit(models.Model):
    file = models.ForeignKey(OnlineEncryptedFile, on_delete=models.CASCADE, related_name='audits')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    status = models.CharField(max_length=20)
    reason = models.CharField(max_length=100, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.file.original_filename} - {self.status}"