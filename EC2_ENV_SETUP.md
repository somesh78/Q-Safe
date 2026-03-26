# EC2 Environment Setup (.env File)

## Critical for Deploy Health Check

The EC2 `docker-compose.yml` now loads environment variables from `~/Q-Safe/.env` via the `env_file` directive. This file **must exist** on the EC2 instance at deployment time, or the health check will fail with connection resets.

## Location on EC2
```bash
~/Q-Safe/.env
```

## Required Variables

Create this file with at minimum the following environment variables. These are essential for the app to start:

```bash
# Django
SECRET_KEY=<your-django-secret-key>
DEBUG=False
ALLOWED_HOSTS=q-safe.live,www.q-safe.live,localhost,127.0.0.1

# Database
DATABASE_URL=postgres://user:password@host:5432/dbname

# Redis (for Celery task queue)
REDIS_URL=redis://q_safe_redis:6379/0
CELERY_BROKER_URL=redis://q_safe_redis:6379/0
CELERY_RESULT_BACKEND=redis://q_safe_redis:6379/0

# Frontend URLs
FRONTEND_URL=https://q-safe.live
CORS_ALLOWED_ORIGINS=https://q-safe.live
CSRF_TRUSTED_ORIGINS=https://q-safe.live

# Email (Gmail SMTP for password resets, notifications)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=noreply@q-safe.live

# Google OAuth
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY=<google-oauth-client-id>
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET=<google-oauth-client-secret>

# Supabase (for file storage)
SUPABASE_URL=<supabase-project-url>
SUPABASE_SERVICE_KEY=<supabase-service-role-key>
SUPABASE_BUCKET=q-safe-transfers
```

## How to Set Up on EC2

### Step 1: SSH into EC2
```bash
ssh -i your-key.pem ubuntu@<ec2-host>
```

### Step 2: Navigate to Q-Safe directory
```bash
cd ~/Q-Safe
```

### Step 3: Create .env file
```bash
nano .env
```

### Step 4: Paste the environment variables
Add all the required variables listed above with your actual values.

### Step 5: Set correct permissions
```bash
chmod 600 .env
```

This restricts the .env file to owner-read-only, as it contains secrets.

### Step 6: Verify file exists
```bash
ls -la .env
cat .env  # verify contents (be careful not to leak secrets in logs)
```

## When to Update

- After changing database credentials
- After rotating session secrets / API keys  
- After changing frontend URLs (for CORS)
- After enabling new integrations (Supabase, Google OAuth, etc.)

## Why This Matters

The original workflow failed at the health check because:
1. Docker Compose tried to substitute empty variables (not in shell environment)
2. Django app started with missing/empty settings like `SECRET_KEY` or `DATABASE_URL`
3. App crashed or became unresponsive, causing the health check to fail with "connection reset"
4. Without logs, there was no visibility into why the app crashed

Now the workflow will:
1. Load .env before starting containers
2. Wait 45s for migrations/startup to complete
3. Show docker-compose logs on failure so you can see the actual error
4. Properly rollback if health check still fails

## Secrets Management

**Best Practice:** Do NOT commit .env to git. Keep it only on EC2:
```bash
# In .gitignore (should already be there):
.env
.env.local
```

For CI/CD and GitHub Actions, secrets are stored in GitHub repository settings under "Secrets and variables" → "Actions", not in git files.
