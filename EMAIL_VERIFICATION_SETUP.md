# Email Verification Setup - IMPORTANT!

## Issue Fixed

Users were getting "verify your email" errors during login but **no verification email was being sent**.

### What Was Fixed

✅ **Signup process** now sends verification email  
✅ **Verification endpoint** created (`/api/verify-email/<uid>/<token>/`)  
✅ **Resend email endpoint** added (`/api/resend-verification/`)  
✅ **Email utilities** integrated with signup flow  

## Email Configuration Required

For email verification to work in **production**, you MUST configure email settings.

### Option 1: Gmail SMTP (Recommended for Testing)

**1. Create App Password:**
- Go to https://myaccount.google.com/security
- Enable 2-Step Verification
- Go to "App passwords"
- Generate password for "Mail"
- Copy the 16-character password

**2. Set Environment Variables:**

```bash
# In your .env file or EC2 environment
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=Q-Safe <your-email@gmail.com>
FRONTEND_URL=http://your-ec2-ip
```

**3. Update Docker Compose:**

Ensure these are in `docker-compose.yml`:
```yaml
environment:
  - EMAIL_BACKEND=${EMAIL_BACKEND}
  - EMAIL_HOST=${EMAIL_HOST}
  - EMAIL_PORT=${EMAIL_PORT}
  - EMAIL_USE_TLS=${EMAIL_USE_TLS}
  - EMAIL_HOST_USER=${EMAIL_HOST_USER}
  - EMAIL_HOST_PASSWORD=${EMAIL_HOST_PASSWORD}
  - DEFAULT_FROM_EMAIL=${DEFAULT_FROM_EMAIL}
  - FRONTEND_URL=${FRONTEND_URL}
```

### Option 2: SendGrid (Recommended for Production)

**1. Sign up at https://sendgrid.com** (Free tier: 100 emails/day)

**2. Create API Key:**
- Dashboard → Settings → API Keys
- Create API Key
- Copy the key

**3. Set Environment Variables:**

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@your-domain.com
FRONTEND_URL=https://your-domain.com
```

### Option 3: Mailgun, AWS SES, etc.

Configure similarly with your provider's SMTP settings.

## Testing Email Locally

**Development (Console Backend):**
Current default - emails print to console/logs:
```python
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

**View emails in terminal:**
```bash
cd backend
python manage.py runserver
# Emails appear in terminal output
```

## Verify It Works

### 1. Test Signup Flow

```bash
# Sign up a new user
curl -X POST http://localhost:8000/api/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Check response
# Should say: "Please check your email to verify your account"
```

### 2. Check Email Logs

**Docker:**
```bash
docker-compose logs -f web | grep -i "email\|verify"
```

**Local:**
```bash
# Console backend - email appears in terminal
# SMTP backend - check Django logs
```

### 3. Manual Verification (Testing)

If email isn't working yet, manually verify a user in Django admin:

```bash
# Access admin panel
http://your-domain/admin

# Login with superuser
# Go to: Transfers → User profiles
# Find the user and check "Is verified"
```

## Email Verification Flow

```
1. User signs up
   ↓
2. Account created (is_verified=False)
   ↓
3. Verification email sent with token link
   ↓
4. User clicks link in email
   ↓
5. GET /api/verify-email/<uid>/<token>/
   ↓
6. Token validated, is_verified=True
   ↓
7. User can now log in
```

## Common Issues

### "Email delivery failed" message

**Check:**
1. Email environment variables are set
2. SMTP credentials are correct
3. Gmail: App password (not regular password)
4. SendGrid: API key is valid
5. Firewall allows outbound port 587

**Debug:**
```bash
# Test email from Django shell
docker-compose run --rm web python manage.py shell

>>> from django.core.mail import send_mail
>>> send_mail(
...     'Test',
...     'Test message',
...     'from@example.com',
...     ['to@example.com'],
... )
# Should return 1 if successful
```

### "Verification link expired"

Tokens expire after **24 hours**. User must request a new verification email:

```javascript
// In frontend
await axios.post('/api/resend-verification/', {}, {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

### Can't log in - "verify your email"

**Solutions:**
1. Check email inbox (and spam folder)
2. Resend verification email
3. Manually verify in admin panel (testing only)
4. Check email configuration is correct

## Production Deployment Checklist

Before deploying to production:

- [ ] Set EMAIL_BACKEND to SMTP (not console)
- [ ] Configure SMTP credentials (Gmail/SendGrid/etc)
- [ ] Set FRONTEND_URL to your production domain
- [ ] Set DEFAULT_FROM_EMAIL to professional address
- [ ] Test signup flow end-to-end
- [ ] Verify email delivery works
- [ ] Check spam folder if emails not arriving
- [ ] Monitor email logs for errors

## Email Template Customization

Email template is in `backend/transfers/email_utils.py`:

```python
def send_verification_email(user, uid, token):
    # Customize subject, message, html_message here
```

You can:
- Change email styling
- Add your logo
- Customize messaging
- Add footer links

## Rate Limiting

Verification emails are rate limited:
- **Signup:** 5 signups per hour per IP
- **Resend:** 3 resends per hour per user

This prevents abuse.

## Monitoring

**Track email delivery:**
```bash
# Check logs for email sending
docker-compose logs web | grep "SIGNUP\|VERIFY\|RESEND"
```

**Successful signup:**
```
[SIGNUP] Verification email sent to user@example.com
```

**Successful verification:**
```
[VERIFY] Successfully verified email for username
```

## Next Steps

1. **Configure email** (Gmail or SendGrid)
2. **Update environment variables** on EC2
3. **Redeploy** with email settings
4. **Test signup** → check email → verify → login

Once configured, the complete user flow will work:
- User signs up → receives email
- Clicks verification link → account verified
- Logs in successfully → full access

🎉 **Email verification is now fully functional!**
