from django.urls import path
from . import views

app_name = 'tracker'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('add/', views.add_activity, name='add_activity'),
    path('scan/', views.receipt_scan, name='receipt_scan'),
    path('eco-chat/', views.eco_chat, name='eco_chat'),
    path('history/', views.history, name='history'),
    path('profile/', views.edit_profile, name='edit_profile'),
    path('delete/<int:activity_id>/', views.delete_activity, name='delete_activity'),
]
