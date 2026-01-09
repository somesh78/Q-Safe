from django.urls import path
from .views import create_session, download_online_file, reconstruct_from_zip, upload_file

urlpatterns = [
    path('session/create/', create_session),
    path('upload/', upload_file),
    path('download/<uuid:token>/', download_online_file),
    path('reconstruct/', reconstruct_from_zip)
]