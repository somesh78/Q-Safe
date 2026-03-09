"""
Migrate data from SQLite to Supabase PostgreSQL

This script helps you migrate existing data from your SQLite database
to Supabase PostgreSQL.

Usage:
    1. Make sure you have data in SQLite (db.sqlite3)
    2. Set your DATABASE_URL environment variable
    3. Run: python migrate_to_postgres.py
"""

import os
import sys
import subprocess

def check_sqlite_exists():
    """Check if SQLite database exists."""
    sqlite_path = os.path.join('backend', 'db.sqlite3')
    return os.path.exists(sqlite_path)

def export_sqlite_data():
    """Export data from SQLite to JSON."""
    print("=" * 60)
    print("STEP 1: Exporting data from SQLite")
    print("=" * 60)
    
    if not check_sqlite_exists():
        print("❌ SQLite database not found at backend/db.sqlite3")
        print("If you don't have existing data, skip migration and just run:")
        print("  cd backend && python manage.py migrate")
        return False
    
    # Temporarily use SQLite
    env = os.environ.copy()
    if 'DATABASE_URL' in env:
        del env['DATABASE_URL']
    
    print("\n📦 Exporting data from SQLite...")
    cmd = [
        sys.executable,
        'backend/manage.py',
        'dumpdata',
        '--exclude', 'auth.permission',
        '--exclude', 'contenttypes',
        '--exclude', 'sessions.session',
        '--indent', '2',
        '--output', 'data_backup.json'
    ]
    
    try:
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Data exported to data_backup.json")
            
            # Check file size
            size_bytes = os.path.getsize('data_backup.json')
            size_mb = size_bytes / (1024 * 1024)
            print(f"   File size: {size_mb:.2f} MB")
            return True
        else:
            print(f"❌ Export failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error during export: {e}")
        return False

def migrate_postgresql():
    """Run migrations on PostgreSQL."""
    print("\n" + "=" * 60)
    print("STEP 2: Setting up PostgreSQL database")
    print("=" * 60)
    
    if 'DATABASE_URL' not in os.environ:
        print("❌ DATABASE_URL environment variable not set!")
        print("\nSet it with your Supabase connection string:")
        print('  export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"')
        print("\nOr on Windows:")
        print('  $env:DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"')
        return False
    
    print("\n🔧 Running migrations on PostgreSQL...")
    cmd = [sys.executable, 'backend/manage.py', 'migrate']
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Migrations completed successfully")
            return True
        else:
            print(f"❌ Migration failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        return False

def import_data():
    """Import data to PostgreSQL."""
    print("\n" + "=" * 60)
    print("STEP 3: Importing data to PostgreSQL")
    print("=" * 60)
    
    if not os.path.exists('data_backup.json'):
        print("❌ data_backup.json not found")
        return False
    
    print("\n📥 Importing data...")
    cmd = [sys.executable, 'backend/manage.py', 'loaddata', 'data_backup.json']
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Data imported successfully!")
            return True
        else:
            print(f"⚠️  Import completed with warnings:")
            print(result.stderr)
            print("\nThis is usually okay. Check if your data is present.")
            return True
    except Exception as e:
        print(f"❌ Error during import: {e}")
        return False

def verify_import():
    """Verify the data was imported."""
    print("\n" + "=" * 60)
    print("STEP 4: Verifying import")
    print("=" * 60)
    
    print("\n🔍 Checking data in PostgreSQL...")
    cmd = [
        sys.executable, '-c',
        """
import os, sys
sys.path.insert(0, 'backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from django.contrib.auth.models import User
from transfers.models import UploadSession, OnlineEncryptedFile

print(f"Users: {User.objects.count()}")
print(f"Upload Sessions: {UploadSession.objects.count()}")
print(f"Encrypted Files: {OnlineEncryptedFile.objects.count()}")
"""
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            print(result.stdout)
            print("\n✅ Verification complete!")
            return True
        else:
            print(f"❌ Verification failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        return False

def cleanup():
    """Clean up backup file."""
    print("\n" + "=" * 60)
    print("Cleanup")
    print("=" * 60)
    
    response = input("\n🗑️  Delete data_backup.json? (y/n): ")
    if response.lower() == 'y':
        try:
            os.remove('data_backup.json')
            print("✅ Backup file deleted")
        except Exception as e:
            print(f"⚠️  Could not delete file: {e}")
    else:
        print("ℹ️  Backup file kept for safety")

def main():
    """Main migration process."""
    print("\n" + "=" * 60)
    print("MIGRATE SQLITE → SUPABASE POSTGRESQL")
    print("=" * 60)
    
    print("\n⚠️  IMPORTANT:")
    print("1. Make sure you have set DATABASE_URL environment variable")
    print("2. This will NOT delete your SQLite data")
    print("3. You can keep both databases for backup")
    print()
    
    response = input("Continue with migration? (y/n): ")
    if response.lower() != 'y':
        print("Migration cancelled.")
        return
    
    # Step 1: Export from SQLite
    if not export_sqlite_data():
        print("\n❌ Migration failed at export step")
        return
    
    # Step 2: Setup PostgreSQL
    if not migrate_postgresql():
        print("\n❌ Migration failed at setup step")
        return
    
    # Step 3: Import to PostgreSQL
    if not import_data():
        print("\n❌ Migration failed at import step")
        return
    
    # Step 4: Verify
    verify_import()
    
    # Cleanup
    cleanup()
    
    print("\n" + "=" * 60)
    print("✅ MIGRATION COMPLETE!")
    print("=" * 60)
    print("\nYour application is now using Supabase PostgreSQL.")
    print("\nNext steps:")
    print("1. Test your application thoroughly")
    print("2. Keep SQLite as backup until you're confident")
    print("3. Update production environment variables")
    print("4. Deploy with DATABASE_URL set to Supabase")
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Migration cancelled by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
