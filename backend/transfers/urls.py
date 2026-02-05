from django.urls import path
from .views import *

urlpatterns = [
    path('session/create/', create_session),
    path('upload/', upload_file),   
    path('download/<str:signed_token>/', download_online_file),
    path('reconstruct/', reconstruct_from_zip),
    path('audit/', audit_logs),
    path('signup/', signup),  # Consistent with /api/token/ pattern
    path('logout/', logout),
    path('dashboard/', user_files),
    path('job-status/<uuid:job_id>/', job_status),
    path('job-download/<uuid:job_id>/', job_download),
]