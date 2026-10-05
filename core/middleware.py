from django.conf import settings


class FrameAncestorsMiddleware:
    """Send CSP frame-ancestors so only settings.FRAME_ANCESTORS may embed the app.

    Used instead of XFrameOptionsMiddleware, which can only express DENY/SAMEORIGIN
    and so blocks the HuggingFace Spaces page from showing the app in its iframe.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.header_value = 'frame-ancestors ' + ' '.join(settings.FRAME_ANCESTORS)

    def __call__(self, request):
        response = self.get_response(request)
        response.headers.setdefault('Content-Security-Policy', self.header_value)
        return response
