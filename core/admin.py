from django.contrib import admin
from .models import MaterialFactor, PredictionLog


@admin.register(MaterialFactor)
class MaterialFactorAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'emission_factor_kg_co2_per_kg', 'manufacturing_intensity', 'biodegradable']
    list_filter = ['category', 'manufacturing_intensity', 'biodegradable']
    search_fields = ['name', 'category']


@admin.register(PredictionLog)
class PredictionLogAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'material', 'weight_kg', 'transport_mode', 'predicted_co2_kg', 'created_at']
    list_filter = ['material', 'transport_mode', 'created_at']
    search_fields = ['product_name', 'material']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
