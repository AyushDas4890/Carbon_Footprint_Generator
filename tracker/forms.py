from django import forms
from .models import ActivityLog, CarbonCategory, UserProfile


class ActivityLogForm(forms.ModelForm):
    """Form for logging a new carbon footprint activity"""
    
    class Meta:
        model = ActivityLog
        fields = ['category', 'description', 'cost', 'carbon_amount', 'image']
        widgets = {
            'category': forms.Select(attrs={'class': 'form-control'}),
            'description': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'e.g., Drove 20 miles to work'
            }),
            'cost': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0.00',
                'step': '0.01'
            }),
            'carbon_amount': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0.00',
                'step': '0.01'
            }),
            'image': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['category'].queryset = CarbonCategory.objects.all()
        # Allow blank: Phase 2 can auto-calculate carbon via AI/heuristics
        self.fields['carbon_amount'].required = False
        self.fields['description'].required = True


class ReceiptScanForm(forms.Form):
    image = forms.ImageField()


class EcoChatForm(forms.Form):
    message = forms.CharField(
        max_length=500,
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'placeholder': 'Ask for eco tips based on your recent activities...',
            }
        ),
    )


class UserProfileForm(forms.ModelForm):
    """Form for updating user profile and monthly goal"""
    
    class Meta:
        model = UserProfile
        fields = ['monthly_goal']
        widgets = {
            'monthly_goal': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'e.g., 1000',
                'step': '0.01'
            }),
        }
