"""
Create a new admin user or reset password
Run this script to create a fresh admin account
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'carbon_tracker.settings')
django.setup()

from django.contrib.auth.models import User
from tracker.models import CarbonCategory

def create_admin():
    """Create a new admin user"""
    print("=" * 60)
    print("Creating New Admin User")
    print("=" * 60)
    print()
    
    username = 'admin'
    email = 'admin@example.com'
    password = 'admin123'  # Change this after first login!
    
    # Check if user exists
    if User.objects.filter(username=username).exists():
        user = User.objects.get(username=username)
        user.set_password(password)
        user.is_superuser = True
        user.is_staff = True
        user.save()
        print(f"[OK] Reset password for existing user: {username}")
    else:
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        print(f"[OK] Created new admin user: {username}")
    
    print()
    print("Login Credentials:")
    print(f"  Username: {username}")
    print(f"  Password: {password}")
    print()
    print("IMPORTANT: Change this password after first login!")
    print()
    print("Next steps:")
    print("  1. Start server: python manage.py runserver")
    print("  2. Login at: http://127.0.0.1:8000/admin")
    print("  3. Use app at: http://127.0.0.1:8000")
    print()

def init_categories():
    """Initialize categories if they don't exist"""
    print("Checking categories...")
    categories = [
        {'name': 'Food', 'description': 'Food and beverage consumption', 'icon': 'Food'},
        {'name': 'Transport', 'description': 'Transportation and travel', 'icon': 'Transport'},
        {'name': 'Energy', 'description': 'Energy consumption (electricity, heating, etc.)', 'icon': 'Energy'},
    ]
    
    created = 0
    for cat_data in categories:
        category, was_created = CarbonCategory.objects.get_or_create(
            name=cat_data['name'],
            defaults={'description': cat_data['description'], 'icon': cat_data['icon']}
        )
        if was_created:
            created += 1
            print(f"  [OK] Created category: {category.name}")
    
    if created == 0:
        print("  -> All categories already exist")
    print()

if __name__ == '__main__':
    init_categories()
    create_admin()
