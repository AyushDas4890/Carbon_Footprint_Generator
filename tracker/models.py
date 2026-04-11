from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator


class CarbonCategory(models.Model):
    """Categories for carbon footprint activities"""
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name or emoji")
    
    class Meta:
        verbose_name_plural = "Carbon Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ActivityLog(models.Model):
    """Log of user activities that contribute to carbon footprint"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    category = models.ForeignKey(CarbonCategory, on_delete=models.SET_NULL, null=True, related_name='activities')
    description = models.CharField(max_length=200)
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, 
                               validators=[MinValueValidator(0)])
    carbon_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Carbon footprint in kg CO2 equivalent (leave blank to auto-calculate)",
    )
    date = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='receipts/', blank=True, null=True)
    
    class Meta:
        ordering = ['-date']
        verbose_name_plural = "Activity Logs"
    
    def __str__(self):
        return f"{self.user.username} - {self.description} ({self.date.date()})"


class UserProfile(models.Model):
    """Extended user profile with carbon footprint goals"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    monthly_goal = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                       validators=[MinValueValidator(0)],
                                       help_text="Monthly carbon footprint goal in kg CO2 equivalent")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    def get_total_carbon_this_month(self):
        """Calculate total carbon footprint for current month"""
        from django.utils import timezone
        from django.db.models import Sum
        
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        total = self.user.activities.filter(
            date__gte=start_of_month
        ).aggregate(Sum('carbon_amount'))['carbon_amount__sum']
        
        return total or 0
    
    def get_goal_progress(self):
        """Calculate progress towards monthly goal as percentage"""
        if self.monthly_goal == 0:
            return 0
        current = self.get_total_carbon_this_month()
        return min((current / self.monthly_goal) * 100, 100)


class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_messages")
    role = models.CharField(max_length=20, choices=[("user", "user"), ("assistant", "assistant")])
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.user.username} {self.role}: {self.content[:40]}"
