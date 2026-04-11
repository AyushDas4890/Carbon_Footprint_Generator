#!/usr/bin/env python
"""
Complete setup script for Carbon Footprint Tracker
Run this after migrations are complete to initialize categories and create a test user.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'carbon_tracker.settings')
django.setup()

from django.contrib.auth.models import User
from tracker.models import CarbonCategory, UserProfile

def setup_categories():
    """Create default carbon categories"""
    print("📁 Setting up categories...")
    categories = [
        {
            'name': 'Food',
            'description': 'Food and beverage consumption',
            'icon': '🍔'
        },
        {
            'name': 'Transport',
            'description': 'Transportation and travel',
            'icon': '🚗'
        },
        {
            'name': 'Energy',
            'description': 'Energy consumption (electricity, heating, etc.)',
            'icon': '⚡'
        },
    ]
    
    created_count = 0
    for cat_data in categories:
        category, created = CarbonCategory.objects.get_or_create(
            name=cat_data['name'],
            defaults={
                'description': cat_data['description'],
                'icon': cat_data['icon']
            }
        )
        if created:
            created_count += 1
            print(f"  ✅ Created category: {category.name} {category.icon}")
        else:
            print(f"  → Category already exists: {category.name} {category.icon}")
    
    print(f"\n✅ Successfully initialized {created_count} new categories.\n")
    return True

def create_test_user():
    """Create a test user if it doesn't exist"""
    print("👤 Checking for test user...")
    username = 'testuser'
    password = 'testpass123'
    
    if User.objects.filter(username=username).exists():
        print(f"  → User '{username}' already exists")
        return False
    
    try:
        user = User.objects.create_user(
            username=username,
            email='test@example.com',
            password=password
        )
        print(f"  ✅ Created test user: {username}")
        print(f"  📝 Username: {username}")
        print(f"  🔑 Password: {password}")
        print(f"  ⚠️  Please change the password after first login!")
        return True
    except Exception as e:
        print(f"  ❌ Error creating user: {e}")
        return False

def main():
    print("=" * 50)
    print("🌱 Carbon Footprint Tracker - Setup Script")
    print("=" * 50)
    print()
    
    try:
        # Setup categories
        setup_categories()
        
        # Create test user
        create_test_user()
        
        print("=" * 50)
        print("✅ Setup complete!")
        print("=" * 50)
        print("\nNext steps:")
        print("1. Run: python manage.py runserver")
        print("2. Visit: http://127.0.0.1:8000/admin")
        print("3. Login with your superuser or testuser/testpass123")
        print("4. Go to: http://127.0.0.1:8000 to use the app")
        print()
        
    except Exception as e:
        print(f"\n❌ Error during setup: {e}")
        print("\nMake sure you've run migrations first:")
        print("  python manage.py migrate")
        sys.exit(1)

if __name__ == '__main__':
    main()
