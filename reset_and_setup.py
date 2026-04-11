#!/usr/bin/env python
"""
Reset and setup script for Carbon Footprint Tracker
Deletes existing database and sets up fresh installation
"""
import os
import sys
import django
from pathlib import Path

def delete_database():
    """Delete existing database files"""
    print("Deleting old database files...")
    base_dir = Path(__file__).parent
    db_file = base_dir / 'db.sqlite3'
    journal_file = base_dir / 'db.sqlite3-journal'
    
    deleted = False
    if db_file.exists():
        try:
            db_file.unlink()
            print(f"  [OK] Deleted {db_file}")
            deleted = True
        except Exception as e:
            print(f"  [WARNING] Could not delete {db_file}: {e}")
            print("  Try closing any programs using the database and run again")
            return False
    
    if journal_file.exists():
        try:
            journal_file.unlink()
            print(f"  [OK] Deleted {journal_file}")
        except Exception as e:
            print(f"  [WARNING] Could not delete {journal_file}: {e}")
    
    return deleted

def run_migrations():
    """Run Django migrations"""
    print("\nRunning migrations...")
    result = os.system('python manage.py migrate')
    return result == 0

def init_categories():
    """Initialize categories"""
    print("\nInitializing categories...")
    result = os.system('python manage.py init_categories')
    return result == 0

def run_setup():
    """Run complete setup"""
    print("\nRunning complete setup...")
    result = os.system('python setup_complete.py')
    return result == 0

def main():
    # Set UTF-8 encoding for Windows console
    if sys.platform == 'win32':
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    
    print("=" * 60)
    print("Carbon Footprint Tracker - Reset & Fresh Setup")
    print("=" * 60)
    print("\nWARNING: This will DELETE all existing data!")
    print("   Press Ctrl+C to cancel, or Enter to continue...")
    
    try:
        input()
    except KeyboardInterrupt:
        print("\n\nCancelled by user")
        sys.exit(0)
    
    # Delete database
    if not delete_database():
        print("\nCould not delete database. Please:")
        print("   1. Close any running Django servers")
        print("   2. Close any database viewers")
        print("   3. Run this script again")
        sys.exit(1)
    
    # Run migrations
    if not run_migrations():
        print("\nMigrations failed!")
        sys.exit(1)
    
    # Initialize categories
    init_categories()
    
    # Run complete setup
    run_setup()
    
    print("\n" + "=" * 60)
    print("Reset Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("   1. Create superuser: python manage.py createsuperuser")
    print("   2. Start server: python manage.py runserver")
    print("   3. Login at: http://127.0.0.1:8000/admin")
    print("   4. Use app at: http://127.0.0.1:8000")
    print()

if __name__ == '__main__':
    main()
