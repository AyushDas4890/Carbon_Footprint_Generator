"""Core page views — home form, results, insights, compare, decompose."""
import json
from django.shortcuts import render
from predictor.services import CarbonFootprintService


def home_view(request):
    """Landing page with product input form"""
    service = CarbonFootprintService()
    materials = service.get_available_materials()
    return render(request, 'home.html', {
        'materials': materials,
        'transport_modes': ['AIR', 'SEA', 'ROAD', 'RAIL'],
    })


def results_view(request):
    """Results dashboard (loaded dynamically via AJAX)"""
    return render(request, 'results.html')


def insights_view(request):
    """Model insights and compensation strategies"""
    service = CarbonFootprintService()
    return render(request, 'insights.html', {
        'model_info': service.get_model_info(),
    })


def compare_view(request):
    """Side-by-side product comparison UI."""
    service = CarbonFootprintService()
    return render(request, 'compare.html', {
        'materials_json': json.dumps(service.get_available_materials()),
    })


def decompose_view(request):
    """LLM-powered Bill-of-Materials decomposer UI."""
    return render(request, 'decompose.html')
