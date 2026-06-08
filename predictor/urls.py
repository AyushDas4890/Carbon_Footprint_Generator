from django.urls import path
from .views import (
    PredictCarbonFootprintView,
    ComparePredictionsView,
    GetMaterialsView,
    ModelInfoView,
)

urlpatterns = [
    path('predict/', PredictCarbonFootprintView.as_view(), name='predict'),
    path('compare/', ComparePredictionsView.as_view(), name='compare'),
    path('materials/', GetMaterialsView.as_view(), name='materials'),
    path('model-info/', ModelInfoView.as_view(), name='model_info'),
]
