from django.urls import path
from .views import *

urlpatterns = [
    path('session/create/', create_session),
    path('upload/', upload_file),   
    path('download/<str:signed_token>/', download_online_file),
    path('reconstruct/', reconstruct_from_zip),
    path('audit/', audit_logs),
    path('signup/', signup),
    path('logout/', logout),
    path('dashboard/', user_files),
    path('job-status/<uuid:job_id>/', job_status),
    path('job-download/<uuid:job_id>/', job_download),
    # Email verification
    path('verify-email/<str:uid>/<str:token>/', verify_email),
    path('resend-verification/', resend_verification_email),
    
    path('turn-credentials/', get_turn_credentials),
    path('contact/', contact_message),
]