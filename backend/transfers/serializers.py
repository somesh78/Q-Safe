from rest_framework import serializers
from .models import *

class DownloadAuditSerializer(serializers.ModelSerializer):
    file_name = serializers.CharField(source='file.original_filename')
    class Meta:
        model = DownloadAudit
        fields = '__all__'