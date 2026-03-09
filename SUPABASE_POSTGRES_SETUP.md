# Supabase PostgreSQL Database Setup Guide

This guide explains how to use Supabase PostgreSQL as your main database for the Q-Safe Django application, storing all users, files, and application data.

## Overview

Your Django app is already configured to use PostgreSQL via the `DATABASE_URL` environment variable. Supabase provides a fully managed PostgreSQL database that you can use instead of SQLite.

## Current Configuration

Your `settings.py` already supports PostgreSQL:

```python
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    # Production: PostgreSQL
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=300,
            conn_health_checks=True,
        )
    }
else:
    # Development: SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
```

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project name**: `q-safe` (or your preferred name)
   - **Database password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing plan**: Free tier is fine to start

## Step 2: Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the database password you created

### Connection Pooling (Recommended for Production)

For better performance, use the **connection pooling** string:

1. In **Connection string** section, select **Transaction** mode
2. Copy the pooler string (uses port 6543):
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

## Step 3: Configure Environment Variables

Create a `.env` file in your `backend/` directory:

```bash
# Supabase PostgreSQL Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Or with connection pooling (recommended)
# DATABASE_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Other required settings
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,.onrender.com
```

## Step 4: Run Migrations

With the `DATABASE_URL` set, Django will use PostgreSQL instead of SQLite:

```bash
# Navigate to backend directory
cd backend

# Run migrations to create all tables in PostgreSQL
python manage.py migrate

# Create a superuser for admin access
python manage.py createsuperuser
```

This creates all your Django tables in Supabase PostgreSQL:
- `auth_user` (users)
- `transfers_uploadsession` (upload sessions)
- `transfers_uploadedfile` (uploaded files)
- `transfers_onlineencryptedfile` (encrypted files)
- `transfers_downloadaudit` (download audit logs)
- `transfers_offlinejob` (offline job tracking)
- `transfers_contactmessage` (contact form messages)
- `transfers_userprofile` (user profiles)
- All other Django system tables

## Step 5: Verify Database Connection

Test the connection:

```python
# Python shell
python manage.py shell

# In the shell:
from django.db import connections
from django.db.utils import OperationalError

db_conn = connections['default']
try:
    c = db_conn.cursor()
    print("✓ Database connection successful!")
    print(f"Database: {db_conn.settings_dict['NAME']}")
    print(f"Host: {db_conn.settings_dict['HOST']}")
except OperationalError:
    print("✗ Database connection failed!")
```

## Step 6: View Data in Supabase

1. Go to your Supabase dashboard
2. Click **Table Editor** in the sidebar
3. You'll see all your Django tables
4. Click any table to view/edit data

You can also use the **SQL Editor** to run custom queries:

```sql
-- View all users
SELECT * FROM auth_user;

-- View all encrypted files
SELECT * FROM transfers_onlineencryptedfile;

-- View recent uploads
SELECT * FROM transfers_uploadsession 
ORDER BY created_at DESC 
LIMIT 10;
```

## Step 7: Production Deployment

### For Render.com:

1. Go to your Render service dashboard
2. Click **Environment**
3. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Supabase connection string
4. Click **Save Changes**
5. Render will automatically redeploy

### For Other Platforms:

Set the `DATABASE_URL` environment variable in your hosting platform's settings.

## Migration from SQLite to PostgreSQL

If you have existing data in SQLite that you want to migrate:

### Option 1: Using Django's dumpdata/loaddata

```bash
# 1. Backup SQLite data
python manage.py dumpdata --exclude auth.permission --exclude contenttypes > data_backup.json

# 2. Switch to PostgreSQL (set DATABASE_URL)
export DATABASE_URL="postgresql://..."

# 3. Run migrations on PostgreSQL
python manage.py migrate

# 4. Load data into PostgreSQL
python manage.py loaddata data_backup.json
```

### Option 2: Manual Export/Import

```bash
# Export from SQLite
sqlite3 db.sqlite3 .dump > sqlite_dump.sql

# Edit the dump file to make it PostgreSQL compatible
# Then import to PostgreSQL using psql or Supabase SQL Editor
```

## Supabase Features You Can Use

### 1. Row Level Security (RLS)

Protect your data with PostgreSQL policies:

```sql
-- Enable RLS on a table
ALTER TABLE transfers_onlineencryptedfile ENABLE ROW LEVEL SECURITY;

-- Create policy (example: users can only see their own files)
CREATE POLICY "Users can view own files" 
ON transfers_onlineencryptedfile
FOR SELECT
USING (session_id IN (
  SELECT session_id FROM transfers_uploadsession 
  WHERE user_id = current_user_id()
));
```

### 2. Realtime Subscriptions

Listen to database changes in real-time (useful for notifications):

```javascript
// In your frontend
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Subscribe to new file uploads
supabase
  .channel('file-uploads')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'transfers_onlineencryptedfile' },
    (payload) => {
      console.log('New file uploaded!', payload)
    }
  )
  .subscribe()
```

### 3. Database Backups

Supabase automatically backs up your database daily. You can also:

1. Go to **Settings** → **Database**
2. Scroll to **Database Backups**
3. Click **Create backup** for manual backups

### 4. Connection Pooling

Already configured in your Django settings. Use the pooler URL for production:
- Port 6543 for transaction mode (Django/REST APIs)
- Port 5432 for session mode (long-running connections)

## Monitoring and Maintenance

### Check Database Size

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Monitor Active Connections

In Supabase dashboard:
1. Go to **Reports** → **Database**
2. View active connections, query performance, etc.

### Cleanup Old Data

```sql
-- Delete expired files (older than 30 days)
DELETE FROM transfers_onlineencryptedfile 
WHERE expires_at < NOW() - INTERVAL '30 days';

-- Delete old audit logs
DELETE FROM transfers_downloadaudit 
WHERE timestamp < NOW() - INTERVAL '90 days';
```

## Troubleshooting

### Connection Timeout

If you get connection timeouts:
1. Use the connection pooler URL (port 6543)
2. Reduce `conn_max_age` in settings (currently 300 seconds)
3. Check firewall/network settings

### SSL Errors

If you get SSL certificate errors:
```python
# In settings.py, modify the database connection
DATABASES['default']['OPTIONS'] = {
    'sslmode': 'require',  # Changed from 'prefer'
}
```

### Migration Errors

If migrations fail:
1. Check that `psycopg2-binary` is installed (it's in requirements.txt)
2. Verify DATABASE_URL is correct
3. Ensure database user has CREATE/ALTER permissions

## Security Best Practices

1. ✅ **Never commit** `.env` file to Git
2. ✅ **Use connection pooling** in production
3. ✅ **Enable RLS** on sensitive tables
4. ✅ **Rotate database password** periodically
5. ✅ **Monitor query performance** in Supabase dashboard
6. ✅ **Set up database backups** (Supabase does this automatically)

## Cost Considerations

**Free Tier Limits:**
- 500 MB database space
- 1 GB file storage
- 2 GB bandwidth
- Unlimited API requests
- Up to 50 MB file uploads

For Q-Safe's use case (encrypted file metadata in DB, files in Supabase Storage), the free tier should be sufficient for moderate traffic.

## Next Steps

1. ✓ Set `DATABASE_URL` environment variable
2. ✓ Run `python manage.py migrate`
3. ✓ Create superuser with `python manage.py createsuperuser`
4. ✓ Test your application
5. ✓ Deploy to production with Supabase connection string

Your Django app will now use Supabase PostgreSQL for all data storage!
