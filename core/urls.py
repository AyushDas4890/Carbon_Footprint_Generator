from django.urls import path
from . import views

# Every page is rendered client-side by the React app; the names are kept so
# reverse() keeps working for links and tests.
urlpatterns = [
    path('', views.spa_view, name='home'),
    path('results/', views.spa_view, name='results'),
    path('insights/', views.spa_view, name='insights'),
    path('compare/', views.spa_view, name='compare_page'),
    path('decompose/', views.spa_view, name='decompose_page'),
]
