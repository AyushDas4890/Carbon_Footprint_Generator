"""
Complete Fresh Start - Removes everything and sets up from scratch
"""
import os
import sys
import subprocess
from pathlib import Path

def stop_django_servers():
    """Try to stop any running Django servers"""
    print("Stopping any running Django servers...")
    try:
        # Try to find and kill Python processes running manage.py runserver
        if sys.platform == 'win32':
            subprocess.run(['taskkill', '/F', '/IM', 'python.exe', '/FI', 'WINDOWTITLE eq *runserver*'], 
                         capture_output=True, stderr=subprocess.DEVNULL)
        print("  -> Attempted to stop Django servers")
    except:
        print("  -> Could not stop servers (may not be running)")

def delete_database():
    """Delete database files"""
    print("\nDeleting database files...")
    base_dir = Path(__file__).parent
    files_to_delete = [
        'db.sqlite3',
        'db.sqlite3-journal',
        'db.sqlite3-wal',
        'db.sqlite3-shm'
    ]
    
    deleted_count = 0
    for filename in files_to_delete:
        file_path = base_dir / filename
        if file_path.exists():
            try:
                file_path.unlink()
                print(f"  [OK] Deleted {filename}")
                deleted_count += 1
            except PermissionError:
                print(f"  [ERROR] Cannot delete {filename} - file is locked")
                print(f"          Please close any programs using the database")
                return False
            except Exception as e:
                print(f"  [WARNING] Could not delete {filename}: {e}")
    
    if deleted_count == 0:
        print("  -> No database files found")
    
    return True

def delete_migrations():
    """Delete migration files (optional - keeps the structure)"""
    print("\nResetting migrations...")
    migrations_dir = Path(__file__).parent / 'tracker' / 'migrations'
    
    if migrations_dir.exists():
        # Keep __init__.py and __pycache__
        for file in migrations_dir.glob('*.py'):
            if file.name != '__init__.py':
                try:
                    file.unlink()
                    print(f"  [OK] Deleted {file.name}")
                except Exception as e:
                    print(f"  [WARNING] Could not delete {file.name}: {e}")
    
    print("  -> Migration files cleaned")

def run_migrations():
    """Run fresh migrations"""
    print("\nRunning fresh migrations...")
    result = subprocess.run([sys.executable, 'manage.py', 'migrate'], 
                          capture_output=True, text=True)
    
    if result.returncode == 0:
        print("  [OK] Migrations completed successfully")
        print(result.stdout)
        return True
    else:
        print("  [ERROR] Migrations failed!")
        print(result.stderr)
        return False

def init_categories():
    """Initialize categories"""
    print("\nInitializing categories...")
    result = subprocess.run([sys.executable, 'manage.py', 'init_categories'],
                          capture_output=True, text=True)
    
    if result.returncode == 0:
        print("  [OK] Categories initialized")
        print(result.stdout)
        return True
    else:
        print("  [WARNING] Category initialization had issues")
        print(result.stderr)
        return True  # Not critical

def create_admin():
    """Create admin user"""
    print("\nCreating admin user...")
    try:
        import django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'carbon_tracker.settings')
        django.setup()
        
        from django.contrib.auth.models import User
        
        username = 'admin'
        password = 'admin123'
        
        # Delete existing admin if exists
        User.objects.filter(username=username).delete()
        
        # Create new admin
        User.objects.create_superuser(
            username=username,
            email='admin@example.com',
            password=password
        )
        
        print("  [OK] Admin user created")
        print(f"\n  Username: {username}")
        print(f"  Password: {password}")
        print("  IMPORTANT: Change password after first login!")
        return True
    except Exception as e:
        print(f"  [ERROR] Could not create admin: {e}")
        return False

def main():
    print("=" * 70)
    print("FRESH START - Complete Reset")
    print("=" * 70)
    print("\nThis will:")
    print("  1. Stop any running Django servers")
    print("  2. Delete all database files")
    print("  3. Clean migration files")
    print("  4. Run fresh migrations")
    print("  5. Initialize categories")
    print("  6. Create new admin account")
    print("\n" + "=" * 70)
    print("\nPress Enter to continue, or Ctrl+C to cancel...")
    
    try:
        input()
    except KeyboardInterrupt:
        print("\n\nCancelled by user")
        sys.exit(0)
    
    # Step 1: Stop servers
    stop_django_servers()
    
    # Step 2: Delete database
    if not delete_database():
        print("\n" + "=" * 70)
        print("ERROR: Could not delete database files!")
        print("=" * 70)
        print("\nPlease:")
        print("  1. Close any running Django servers (python manage.py runserver)")
        print("  2. Close any database viewers (DB Browser, etc.)")
        print("  3. Close your IDE if it's accessing the database")
        print("  4. Run this script again")
        print("\nOr manually delete: db.sqlite3 and db.sqlite3-journal")
        sys.exit(1)
    
    # Step 3: Delete migrations (optional)
    delete_migrations()
    
    # Step 4: Run migrations
    if not run_migrations():
        print("\n" + "=" * 70)
        print("ERROR: Migrations failed!")
        print("=" * 70)
        sys.exit(1)
    
    # Step 5: Initialize categories
    init_categories()
    
    # Step 6: Create admin
    if not create_admin():
        print("\nYou can create admin manually with:")
        print("  python manage.py createsuperuser")
    
    print("\n" + "=" * 70)
    print("FRESH START COMPLETE!")
    print("=" * 70)
    print("\nNext steps:")
    print("  1. Start server: python manage.py runserver")
    print("  2. Login at: http://127.0.0.1:8000/admin")
    print("     Username: admin")
    print("     Password: admin123")
    print("  3. Use app at: http://127.0.0.1:8000")
    print()

if __name__ == '__main__':
    main()
