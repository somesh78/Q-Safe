"""
Verify Supabase PostgreSQL Database Connection

Run this script to test your Supabase PostgreSQL connection.

Usage:
    python verify_postgres.py
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connections, OperationalError
from django.contrib.auth.models import User
from transfers.models import UploadSession, OnlineEncryptedFile, DownloadAudit

def test_database_connection():
    """Test database connection and display info."""
    print("=" * 60)
    print("SUPABASE POSTGRESQL CONNECTION TEST")
    print("=" * 60)
    
    db_conn = connections['default']
    settings = db_conn.settings_dict
    
    print(f"\n📊 Database Configuration:")
    print(f"  Engine: {settings.get('ENGINE', 'N/A')}")
    print(f"  Name: {settings.get('NAME', 'N/A')}")
    print(f"  Host: {settings.get('HOST', 'N/A')}")
    print(f"  Port: {settings.get('PORT', 'N/A')}")
    print(f"  User: {settings.get('USER', 'N/A')}")
    
    # Test connection
    print(f"\n🔌 Testing connection...")
    try:
        cursor = db_conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"  ✅ Connected successfully!")
        print(f"  PostgreSQL version: {version.split(',')[0]}")
        cursor.close()
    except OperationalError as e:
        print(f"  ❌ Connection failed: {e}")
        return False
    
    # Test database structure
    print(f"\n📋 Testing database tables...")
    try:
        cursor = db_conn.cursor()
        
        # Check if migrations have been run
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'transfers_%'
        """)
        table_count = cursor.fetchone()[0]
        
        if table_count > 0:
            print(f"  ✅ Found {table_count} Q-Safe tables")
            
            # List tables
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE 'transfers_%'
                ORDER BY table_name
            """)
            tables = cursor.fetchall()
            print(f"\n  Tables:")
            for table in tables:
                print(f"    - {table[0]}")
        else:
            print(f"  ⚠️  No Q-Safe tables found. Run: python manage.py migrate")
        
        cursor.close()
    except Exception as e:
        print(f"  ❌ Error checking tables: {e}")
        return False
    
    # Test Django ORM
    print(f"\n🐍 Testing Django ORM...")
    try:
        user_count = User.objects.count()
        session_count = UploadSession.objects.count()
        file_count = OnlineEncryptedFile.objects.count()
        audit_count = DownloadAudit.objects.count()
        
        print(f"  ✅ ORM working correctly")
        print(f"\n  Data Summary:")
        print(f"    Users: {user_count}")
        print(f"    Upload Sessions: {session_count}")
        print(f"    Encrypted Files: {file_count}")
        print(f"    Download Audits: {audit_count}")
    except Exception as e:
        print(f"  ❌ ORM error: {e}")
        return False
    
    # Check database size
    print(f"\n💾 Database size:")
    try:
        cursor = db_conn.cursor()
        cursor.execute("""
            SELECT 
                pg_size_pretty(pg_database_size(current_database())) as db_size,
                pg_database_size(current_database()) as db_size_bytes
        """)
        result = cursor.fetchone()
        print(f"  Total size: {result[0]}")
        
        # Show free tier limit
        free_tier_bytes = 500 * 1024 * 1024  # 500 MB
        usage_percent = (result[1] / free_tier_bytes) * 100
        print(f"  Free tier usage: {usage_percent:.2f}% (limit: 500 MB)")
        
        cursor.close()
    except Exception as e:
        print(f"  ⚠️  Could not check size: {e}")
    
    # Check largest tables
    print(f"\n📊 Largest tables:")
    try:
        cursor = db_conn.cursor()
        cursor.execute("""
            SELECT 
                schemaname || '.' || tablename as table_name,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            LIMIT 5;
        """)
        tables = cursor.fetchall()
        for table, size in tables:
            print(f"  {table}: {size}")
        cursor.close()
    except Exception as e:
        print(f"  ⚠️  Could not check table sizes: {e}")
    
    print(f"\n{'=' * 60}")
    print(f"✅ All tests passed! Your Supabase PostgreSQL is configured correctly.")
    print(f"{'=' * 60}\n")
    
    return True


def show_next_steps():
    """Show next steps for the user."""
    print("\n📝 Next Steps:")
    print("\n1. If you haven't run migrations yet:")
    print("   cd backend && python manage.py migrate")
    print("\n2. Create a superuser:")
    print("   python manage.py createsuperuser")
    print("\n3. Start the development server:")
    print("   python manage.py runserver")
    print("\n4. Access Django admin:")
    print("   http://localhost:8000/admin")
    print("\n5. View data in Supabase:")
    print("   Go to your Supabase dashboard → Table Editor")
    print()


if __name__ == "__main__":
    try:
        success = test_database_connection()
        if success:
            show_next_steps()
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print("\nMake sure you have:")
        print("  1. Set DATABASE_URL environment variable")
        print("  2. Installed dependencies: pip install -r requirements.txt")
        print("  3. Your Supabase PostgreSQL is accessible")
