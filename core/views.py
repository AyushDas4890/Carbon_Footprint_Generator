"""Serves the React single-page app (built from frontend/ by Vite)."""
from django.conf import settings
from django.http import HttpResponse

SPA_INDEX = settings.BASE_DIR / 'frontend' / 'dist' / 'index.html'


def spa_view(request):
    """Return the SPA shell; React Router renders the page for this URL client-side."""
    try:
        html = SPA_INDEX.read_text(encoding='utf-8')
    except FileNotFoundError:
        return HttpResponse(
            'Frontend not built. Run: npm --prefix frontend ci && npm --prefix frontend run build',
            status=503, content_type='text/plain',
        )
    return HttpResponse(html)
