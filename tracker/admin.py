from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import CarbonCategory, ActivityLog, UserProfile, ChatMessage


@admin.register(CarbonCategory)
class CarbonCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'icon']
    search_fields = ['name', 'description']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'category', 'description', 'carbon_amount', 'date']
    list_filter = ['category', 'date', 'user']
    search_fields = ['description', 'user__username']
    date_hierarchy = 'date'
    readonly_fields = ['date']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'monthly_goal', 'created_at']
    search_fields = ['user__username']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ["user", "role", "created_at"]
    list_filter = ["role", "created_at", "user"]
    search_fields = ["content", "user__username"]


# Create UserProfile when User is created
@admin.action(description='Create profiles for selected users')
def create_profiles(modeladmin, request, queryset):
    for user in queryset:
        UserProfile.objects.get_or_create(user=user)

# Add action to User admin
admin.site.unregister(User)
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    actions = list(BaseUserAdmin.actions) + [create_profiles]
