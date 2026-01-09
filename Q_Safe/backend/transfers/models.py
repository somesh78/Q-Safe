import uuid
from django.db import models

# Create your models here.
class UploadSession(models.Model):
    MODE_CHOICES = (
        ('ONLINE', 'Online'),
        ('OFFLINE', 'Offline')
    )
    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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
    uploaded_at = models.DateTimeField(auto_now_add=True)