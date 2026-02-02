from rest_framework import serializers
from .models import *

class DownloadAuditSerializer(serializers.ModelSerializer):
    file_name = serializers.CharField(source='file.original_filename')
    class Meta:
        model = DownloadAudit
        fields = '__all__'

class UserFieldSerializer(serializers.ModelSerializer):
    expiers_at = serializers.DateTimeField()
    download_count = serializers.IntegerField()
    enabled_ip_lock = serializers.BooleanField()

    class Meta:
        model = OnlineEncryptedFile
        fields = ['original_filename', 'expiers_at', 'download_count', 'enabled_ip_lock']