from django.core.management.base import BaseCommand
from tracker.models import CarbonCategory


class Command(BaseCommand):
    help = 'Initialize default carbon categories'

    def handle(self, *args, **options):
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
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Category already exists: {category.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\nSuccessfully initialized {created_count} new categories.')
        )
