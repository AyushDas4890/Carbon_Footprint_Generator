from django.db import models

class MaterialFactor(models.Model):
    """Base emission factors for training generation (LCA Data)"""
    name = models.CharField(max_length=100, unique=True)  # e.g., "Cotton", "Steel"
    category = models.CharField(max_length=50)  # e.g., "Fabric", "Metal"
    emission_factor_kg_co2_per_kg = models.FloatField()  # kg CO2e per kg of material
    biodegradable = models.BooleanField(default=False)
    manufacturing_intensity = models.CharField(
        max_length=20,
        choices=[
            ('LOW', 'Low Intensity'),
            ('MEDIUM', 'Medium Intensity'),
            ('HIGH', 'High Intensity')
        ],
        default='MEDIUM'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Material Factors"
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.category})"


class PredictionLog(models.Model):
    """Stores user queries for future analytics and model retraining"""
    product_name = models.CharField(max_length=200)
    material = models.CharField(max_length=100)
    weight_kg = models.FloatField()
    transport_mode = models.CharField(
        max_length=20,
        choices=[
            ('AIR', 'Air'),
            ('SEA', 'Sea'),
            ('ROAD', 'Road'),
            ('RAIL', 'Rail')
        ]
    )
    transport_distance_km = models.FloatField()
    predicted_co2_kg = models.FloatField()
    material_co2 = models.FloatField(null=True, blank=True)
    manufacturing_co2 = models.FloatField(null=True, blank=True)
    transport_co2 = models.FloatField(null=True, blank=True)
    trees_to_offset = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Prediction Logs"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.product_name} - {self.predicted_co2_kg:.2f} kg CO2e"
