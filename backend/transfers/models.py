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
    password = models.CharField(max_length=500, null=True, blank=True)  # For async task access
    original_filename = models.CharField(max_length=255, null=True, blank=True)  # For async task
    created_at = models.DateTimeField(auto_now_add=True)

class UploadedFile(models.Model):
    session = models.ForeignKey(UploadSession, on_delete=models.CASCADE, related_name='files')
    original_filename = models.CharField(max_length=255)
    chunk_index = models.IntegerField(default=0)
    chunk_data = models.BinaryField(default=b'')
    total_chunks = models.IntegerField(default=1)
    size = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

class OnlineEncryptedFile(models.Model):
    session = models.OneToOneField(UploadSession, on_delete=models.CASCADE, related_name='online_encrypted')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    encrypted_data = models.BinaryField(null=True, blank=True)  # Legacy: will be migrated to Supabase Storage
    file_path = models.CharField(max_length=500, null=True, blank=True)  # Supabase Storage path
    original_filename = models.CharField(max_length=255)

    expires_at = models.DateTimeField(default=default_expiry)
    download_count = models.IntegerField(default=0)
    max_downloads = models.IntegerField(default=3)  # Configurable max downloads

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

class OfflineJob(models.Model):
    """Stores async job information for offline QR code generation"""
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    )
    
    job_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField(UploadSession, on_delete=models.CASCADE, related_name='offline_job')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='offline_jobs')
    
    original_filename = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Progress tracking
    total_chunks = models.IntegerField(default=0)
    processed_chunks = models.IntegerField(default=0)
    
    # Result storage
    result_file = models.BinaryField(null=True, blank=True)  # Stores the ZIP file
    error_message = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Job {self.job_id} - {self.status}"
    
    @property
    def progress_percent(self):
        if self.total_chunks == 0:
            return 0
        return int((self.processed_chunks / self.total_chunks) * 100)


class ContactMessage(models.Model):
    """Stores contact form submissions."""
    TYPE_CHOICES = (
        ('general', 'General Inquiry'),
        ('support', 'Technical Support'),
        ('sales', 'Sales & Pricing'),
        ('security', 'Security Issue'),
        ('feedback', 'Feedback'),
    )

    name = models.CharField(max_length=200)
    email = models.EmailField()
    subject = models.CharField(max_length=300)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='general')
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.type}] {self.subject} — {self.name}"


class UserProfile(models.Model):
    """Extension of Django's built-in User model.
    Using OneToOne instead of custom User model to avoid
    breaking existing migrations and data.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} — {'Verified' if self.is_verified else 'Unverified'}"


# Auto-create UserProfile when a new User is created
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)

