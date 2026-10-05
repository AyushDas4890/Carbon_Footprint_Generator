"""URL configuration for carbon_project project."""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def healthcheck(_request):
    """Lightweight liveness check for load balancers + uptime monitors."""
    return JsonResponse({'status': 'ok', 'service': 'c4future'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', healthcheck, name='health'),
    path('api/', include('predictor.urls')),
    path('', include('advisor.urls')),
    path('', include('core.urls')),
]
