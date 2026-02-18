"""
Email verification utilities for Q-Safe.
Uses Django's built-in token generator for secure, time-limited tokens.
"""
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
from decouple import config
import logging

logger = logging.getLogger(__name__)


def generate_verification_token(user):
    """Generate a URL-safe uid + token pair for email verification."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return uid, token


def send_verification_email(user, uid, token):
    """Send a verification email to the user with a clickable link."""
    frontend_url = config('FRONTEND_URL', default='https://q-safe-frontend.onrender.com')
    verification_link = f"{frontend_url}/verify-email/{uid}/{token}/"

    subject = "Verify your Q-Safe account"
    message = f"""Hi {user.username},

Thanks for signing up for Q-Safe!

Please verify your email address by clicking the link below:

{verification_link}

This link will expire in 24 hours.

If you didn't create a Q-Safe account, you can safely ignore this email.

— The Q-Safe Team
"""

    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00d4ff; font-size: 28px; margin: 0;">Q-Safe</h1>
            <p style="color: #888; font-size: 14px; margin-top: 5px;">Secure File Sharing</p>
        </div>
        
        <div style="background: #0a0a0a; border: 1px solid #222; border-radius: 12px; padding: 40px; text-align: center;">
            <h2 style="color: #fff; margin-top: 0;">Verify Your Email</h2>
            <p style="color: #aaa; font-size: 15px; line-height: 1.6;">
                Hi <strong style="color: #fff;">{user.username}</strong>, thanks for signing up! 
                Click the button below to verify your email address.
            </p>
            
            <a href="{verification_link}" 
               style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #00d4ff, #0099cc); 
                      color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; 
                      margin: 20px 0;">
                Verify Email
            </a>
            
            <p style="color: #666; font-size: 13px; margin-top: 25px;">
                This link expires in 24 hours.<br/>
                If you didn't create this account, ignore this email.
            </p>
        </div>
        
        <p style="color: #555; font-size: 12px; text-align: center; margin-top: 30px;">
            &copy; Q-Safe — Secure File Sharing
        </p>
    </div>
    """

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"[EMAIL] Verification email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"[EMAIL] Failed to send verification email to {user.email}: {e}")
        return False
