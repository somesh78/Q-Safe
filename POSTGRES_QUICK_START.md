# Quick Reference: Supabase PostgreSQL for Q-Safe

## Environment Setup

```bash
# .env file (backend/)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

## Quick Start Commands

```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Test connection
python manage.py dbshell
```

## Get Your Connection String

1. **Supabase Dashboard** → Settings → Database
2. Copy **Connection string** (URI format)
3. Replace `[YOUR-PASSWORD]` with your database password

**Direct Connection:**
```
postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**Connection Pooling (Production):**
```
postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## View Your Data

**Supabase Dashboard:**
- Table Editor → View all Django tables
- SQL Editor → Run custom queries

**Django Admin:**
```bash
python manage.py runserver
# Visit http://localhost:8000/admin
```

## Common Tasks

### Check Database
```bash
python manage.py shell
>>> from django.db import connection
>>> print(connection.settings_dict['NAME'])
>>> print(connection.settings_dict['HOST'])
```

### Backup Data
```bash
# Export all data
python manage.py dumpdata --exclude auth.permission --exclude contenttypes > backup.json

# Import data
python manage.py loaddata backup.json
```

### View Tables in Supabase
Your Django models become these PostgreSQL tables:
- `auth_user` - User accounts
- `transfers_uploadsession` - Upload sessions
- `transfers_onlineencryptedfile` - Encrypted files
- `transfers_downloadaudit` - Download logs
- `transfers_offlinejob` - Async jobs

## Production Deployment

**Render.com:**
1. Dashboard → Environment
2. Add `DATABASE_URL` = Your Supabase connection string
3. Save (auto-deploys)

**Other Platforms:**
Set `DATABASE_URL` environment variable

## Current vs New Database

| Feature | SQLite (Current) | PostgreSQL (Supabase) |
|---------|------------------|----------------------|
| Storage | Local file | Cloud-hosted |
| Concurrent users | Limited | Unlimited |
| Data size | Limited by disk | 500 MB (free tier) |
| Backups | Manual | Automatic daily |
| Security | File-based | User auth, RLS, SSL |
| Monitoring | None | Dashboard + logs |
| Cost | Free | Free (up to 500MB) |

## No Code Changes Needed!

Your Django app is already configured to use PostgreSQL. Just set the `DATABASE_URL` environment variable and run migrations.

All your models, views, and API endpoints work exactly the same. Django handles the database differences automatically.

## Support

- **Supabase Docs**: https://supabase.com/docs/guides/database
- **Django Database Docs**: https://docs.djangoproject.com/en/5.0/ref/databases/#postgresql-notes
- **Django with PostgreSQL**: https://docs.djangoproject.com/en/5.0/ref/databases/#postgresql

See full setup guide: [SUPABASE_POSTGRES_SETUP.md](./SUPABASE_POSTGRES_SETUP.md)
