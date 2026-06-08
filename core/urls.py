from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('results/', views.results_view, name='results'),
    path('insights/', views.insights_view, name='insights'),
    path('compare/', views.compare_view, name='compare_page'),
    path('decompose/', views.decompose_view, name='decompose_page'),
]
