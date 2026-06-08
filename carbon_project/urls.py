"""URL configuration for carbon_project project."""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static


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

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
