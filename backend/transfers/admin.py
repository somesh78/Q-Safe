from django.contrib import admin
from .models import *

class DownloadAuditInline(admin.TabularInline):
    model = DownloadAudit
    extra = 0
    readonly_fields = ('ip_address', 'status', 'reason', 'timestamp')
    can_delete = False

@admin.register(UploadSession)
class UploadSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'user', 'mode', 'is_active', 'created_at')
    list_filter = ('mode', 'is_active', 'created_at')
    search_fields = ('session_id', 'user__username')
    readonly_fields = ('session_id', 'created_at')

@admin.register(UploadedFile)
class UploadedFileAdmin(admin.ModelAdmin):
    list_display = ('original_filename', 'session', 'size', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('original_filename', 'session__session_id')
    readonly_fields = ('uploaded_at',)

@admin.register(OnlineEncryptedFile)
class OnlineEncryptedFileAdmin(admin.ModelAdmin):
    list_display = ('original_filename', 'session', 'token', 'expires_at', 'download_count', 'failed_attempts', 'locked_until', 'enable_ip_lock', 'allowed_ip', 'uploaded_at')
    list_filter = ('enable_ip_lock', 'uploaded_at', 'expires_at')
    search_fields = ('original_filename', 'token', 'session__session_id')
    readonly_fields = ('token', 'uploaded_at')
    inlines = [DownloadAuditInline]

@admin.register(DownloadAudit)
class DownloadAuditAdmin(admin.ModelAdmin):
    list_display = ('file', 'ip_address', 'status', 'reason', 'timestamp')
    list_filter = ('status', 'timestamp')
    search_fields = ('ip_address', 'file__original_filename')
    readonly_fields = ('file', 'ip_address', 'status', 'reason', 'timestamp')