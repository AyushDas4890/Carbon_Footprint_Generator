from django.apps import AppConfig


class PredictorConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'predictor'
    
    def ready(self):
        """Load ML model on Django startup"""
        from .services import CarbonFootprintService
        try:
            # Initialize service (loads model via singleton)
            CarbonFootprintService()
        except Exception as e:
            print(f"⚠️  Warning: Could not load carbon model: {e}")
