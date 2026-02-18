"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.http import JsonResponse, HttpResponseRedirect
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from decouple import config
from urllib.parse import urlencode
import os


def health_check(request):
    """Health check endpoint for Docker/EC2"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'Q-Safe API',
        'redis': os.environ.get('REDIS_URL', 'not configured')
    })


def google_auth_callback(request):
    """
    After Google OAuth completes, social-auth logs the user in via
    Django sessions. This view issues JWT tokens and redirects to
    the React frontend with tokens in the URL query params.
    """
    user = request.user
    frontend_url = config('FRONTEND_URL', default='https://q-safe-frontend.onrender.com')

    if not user.is_authenticated:
        return HttpResponseRedirect(f'{frontend_url}/login?error=auth_failed')

    # Issue JWT tokens
    refresh = RefreshToken.for_user(user)

    params = urlencode({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'email': user.email or '',
        'name': user.get_full_name() or user.username,
    })

    return HttpResponseRedirect(f'{frontend_url}/login?{params}')


urlpatterns = [
    path('admin/', admin.site.urls),

    # Health check
    path('api/health/', health_check, name='health_check'),

    # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Google OAuth2
    path('api/auth/', include('social_django.urls', namespace='social')),
    path('api/auth/google/callback/', google_auth_callback, name='google_auth_callback'),

    # API endpoints
    path('api/', include('transfers.urls')),
]

# Serve React app for all non-API routes (production only)
if not os.environ.get('DEBUG', 'False').lower() == 'true':
    urlpatterns += [
        re_path(r'^(?!api/|admin/|static/).*$', TemplateView.as_view(template_name='index.html'), name='react_app'),
    ]
