from django.apps import AppConfig


class PredictorConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'predictor'
    
    def ready(self):
        """Pre-warm the predictor singleton at Django startup.

        Failures here are non-fatal — the service handles missing models
        internally and endpoints will return graceful 503s if needed.
        """
        from .services import CarbonFootprintService
        try:
            CarbonFootprintService()
        except Exception as e:
            print(f"[predictor.apps] Predictor pre-warm failed: {e}")
