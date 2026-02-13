"""
Carbon Footprint Prediction Service
Loads ML model and provides prediction interface
"""
import joblib
import os
import numpy as np


class CarbonFootprintService:
    """Service for carbon footprint predictions"""
    
    _model_artifacts = None
    _instance = None
    
    def __new__(cls):
        """Singleton pattern to load model once"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_model()
        return cls._instance
    
    def _load_model(self):
        """Load the trained model and encoders"""
        model_path = os.path.join('predictor', 'ml_models', 'carbon_model.joblib')
        if os.path.exists(model_path):
            self._model_artifacts = joblib.load(model_path)
            print(f"✅ Carbon model loaded successfully")
            print(f"   Model R²: {self._model_artifacts['metrics']['r2_score']:.4f}")
        else:
            raise FileNotFoundError(f"Model not found at {model_path}. Please run training first.")
    
    def predict(self, material, weight_kg, transport_mode, transport_distance_km, manufacturing_intensity='MEDIUM'):
        """
        Predict carbon footprint for a product
        
        Args:
            material: str (e.g., 'Cotton', 'Steel')
            weight_kg: float
            transport_mode: str ('AIR', 'SEA', 'ROAD', 'RAIL')
            transport_distance_km: float
            manufacturing_intensity: str ('LOW', 'MEDIUM', 'HIGH')
        
        Returns:
            dict with prediction results
        """
        if self._model_artifacts is None:
            raise RuntimeError("Model not loaded")
        
        try:
            # Extract components
            model = self._model_artifacts['model']
            material_encoder = self._model_artifacts['material_encoder']
            transport_encoder = self._model_artifacts['transport_encoder']
            intensity_encoder = self._model_artifacts['intensity_encoder']
            
            # Encode inputs
            material_encoded = material_encoder.transform([material])[0]
            transport_encoded = transport_encoder.transform([transport_mode])[0]
            intensity_encoded = intensity_encoder.transform([manufacturing_intensity])[0]
            
            # Create feature vector
            X = np.array([[material_encoded, weight_kg, transport_encoded, transport_distance_km, intensity_encoded]])
            
            # Predict
            predicted_co2 = model.predict(X)[0]
            
            # Get detailed breakdown (approximate based on feature importance)
            breakdown = self._calculate_breakdown(
                material, weight_kg, transport_mode, transport_distance_km, manufacturing_intensity
            )
            
            # Calculate compensation
            compensation = self._calculate_compensation(predicted_co2)
            
            # Real-world equivalency
            equivalency = self._get_equivalency(predicted_co2)
            
            return {
                'success': True,
                'co2_kg': round(predicted_co2, 2),
                'breakdown': breakdown,
                'compensation': compensation,
                'equivalency': equivalency,
                'confidence_interval': {
                    'lower': round(predicted_co2 * 0.92, 2),
                    'upper': round(predicted_co2 * 1.08, 2)
                }
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _calculate_breakdown(self, material, weight_kg, transport_mode, distance_km, intensity):
        """Calculate approximate breakdown of emissions"""
        # Emission factors (comprehensive - materials + food)
        MATERIAL_FACTORS = {
            # Manufacturing Materials
            'Cotton': 5.5, 'Polyester': 6.2, 'Wool': 10.4, 'Leather': 17.0,
            'Steel': 2.8, 'Aluminum': 8.2, 'Plastic': 3.5, 'Glass': 0.9,
            'Paper': 1.3, 'Wood': 0.5,
            # Animal Products
            'Beef': 27.0, 'Lamb': 24.0, 'Pork': 12.1, 'Chicken': 6.9, 'Turkey': 10.9,
            # Seafood
            'Fish_Farmed': 5.1, 'Fish_Wild': 2.9, 'Shrimp': 18.0,
            # Dairy & Eggs
            'Milk': 1.9, 'Cheese': 13.5, 'Eggs': 4.8, 'Butter': 12.0,
            # Plant Proteins
            'Tofu': 2.0, 'Lentils': 0.9, 'Beans': 1.0, 'Nuts': 2.3,
            # Grains
            'Rice': 4.0, 'Wheat': 1.4, 'Oats': 1.6, 'Corn': 1.1,
            # Produce
            'Tomatoes': 2.1, 'Potatoes': 0.5, 'Lettuce': 0.9, 'Apples': 0.4, 'Bananas': 0.7
        }
        
        TRANSPORT_FACTORS = {
            'AIR': 0.95, 'SEA': 0.015, 'ROAD': 0.12, 'RAIL': 0.025
        }
        
        MANUFACTURING_BASE = {
            'LOW': 0.5, 'MEDIUM': 1.5, 'HIGH': 3.5
        }
        
        material_co2 = weight_kg * MATERIAL_FACTORS.get(material, 3.0)
        manufacturing_co2 = weight_kg * MANUFACTURING_BASE.get(intensity, 1.5) * 1.4
        transport_co2 = weight_kg * (distance_km / 1000) * TRANSPORT_FACTORS.get(transport_mode, 0.1)
        
        total = material_co2 + manufacturing_co2 + transport_co2
        
        return {
            'materials_percent': round((material_co2 / total) * 100, 1),
            'manufacturing_percent': round((manufacturing_co2 / total) * 100, 1),
            'transport_percent': round((transport_co2 / total) * 100, 1),
            'material_co2': round(material_co2, 2),
            'manufacturing_co2': round(manufacturing_co2, 2),
            'transport_co2': round(transport_co2, 2)
        }
    
    def _calculate_compensation(self, co2_kg):
        """Calculate offsetting recommendations"""
        # One tree absorbs ~20 kg CO2 per year
        trees_needed = co2_kg / 20
        
        # Renewable energy credits (1 credit = ~1000 kg CO2)
        rec_credits = co2_kg / 1000
        
        return {
            'trees_per_year': max(round(trees_needed, 2), 0.01),
            'trees_display': max(int(np.ceil(trees_needed)), 1),
            'rec_credits': round(rec_credits, 3),
            'days_vegan': round(co2_kg / 2.5, 1),  # Avg 2.5 kg CO2 saved per vegan day
            'message': f"Plant {max(int(np.ceil(trees_needed)), 1)} tree{'s' if trees_needed > 1 else ''} to offset this footprint"
        }
    
    def _get_equivalency(self, co2_kg):
        """Convert to real-world equivalency"""
        # Average car emits 0.25 kg CO2 per km
        km_driving = co2_kg / 0.25
        
        # Average smartphone charge: 0.008 kg CO2
        smartphone_charges = co2_kg / 0.008
        
        # Washing machine load: 0.6 kg CO2
        washing_loads = co2_kg / 0.6
        
        return {
            'car_km': round(km_driving, 1),
            'smartphone_charges': int(smartphone_charges),
            'washing_loads': round(washing_loads, 1),
            'display': f"Driving a car for {round(km_driving, 1)} km"
        }
    
    def get_available_materials(self):
        """Return list of supported materials"""
        if self._model_artifacts:
            return list(self._model_artifacts['material_encoder'].classes_)
        return []
    
    def get_model_info(self):
        """Return model metadata"""
        if self._model_artifacts:
            return {
                'r2_score': self._model_artifacts['metrics']['r2_score'],
                'rmse': self._model_artifacts['metrics']['rmse'],
                'mae': self._model_artifacts['metrics']['mae'],
                'feature_names': self._model_artifacts['feature_names']
            }
        return None
