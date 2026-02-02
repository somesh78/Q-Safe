from django.urls import path
from .views import *

urlpatterns = [
    path('session/create/', create_session),
    path('upload/', upload_file),   
    path('download/<str:signed_token>/', download_online_file),
    path('reconstruct/', reconstruct_from_zip),
    path('audit/', audit_logs),
    path('auth/signup/', signup), 
    path('logout/', logout),
    path('dashboard/', user_files),
]