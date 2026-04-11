"""
Setup script to initialize the Carbon Footprint Tracker project.
Run this after migrations to set up initial data.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'carbon_tracker.settings')
django.setup()

from tracker.models import CarbonCategory

def setup_categories():
    """Create default carbon categories"""
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
    
    for cat_data in categories:
        category, created = CarbonCategory.objects.get_or_create(
            name=cat_data['name'],
            defaults={
                'description': cat_data['description'],
                'icon': cat_data['icon']
            }
        )
        if created:
            print(f'✓ Created category: {category.name}')
        else:
            print(f'→ Category already exists: {category.name}')

if __name__ == '__main__':
    print('Setting up initial categories...')
    setup_categories()
    print('\nSetup complete!')
