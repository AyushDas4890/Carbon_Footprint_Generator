from django.shortcuts import render
from predictor.services import CarbonFootprintService


def home_view(request):
    """Landing page with product input form"""
    service = CarbonFootprintService()
    materials = service.get_available_materials()
    
    context = {
        'materials': materials,
        'transport_modes': ['AIR', 'SEA', 'ROAD', 'RAIL']
    }
    return render(request, 'home.html', context)


def results_view(request):
    """Results dashboard (loaded dynamically via AJAX)"""
    return render(request, 'results.html')


def insights_view(request):
    """Model insights and compensation strategies"""
    service = CarbonFootprintService()
    model_info = service.get_model_info()
    
    context = {
        'model_info': model_info
    }
    return render(request, 'insights.html', context)
