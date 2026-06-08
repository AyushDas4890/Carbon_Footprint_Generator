"""
Carbon Footprint Prediction Service — v3 (conformal + SHAP + real data).

Loads the best available model. Priority:
  1. carbon_xgb.joblib (Phase 2 — XGBoost + quantile + conformal + SHAP)
  2. carbon_model.joblib (legacy RandomForest fallback)

Both expose the same `predict()` contract so views don't care which is loaded.
"""
import os
import joblib
import numpy as np
from pathlib import Path

MODEL_DIR = Path(__file__).resolve().parent / 'ml_models'
XGB_PATH = MODEL_DIR / 'carbon_xgb.joblib'
RF_PATH = MODEL_DIR / 'carbon_model.joblib'


MATERIAL_FACTORS = {
    'Cotton': 5.5, 'Polyester': 6.2, 'Wool': 10.4, 'Leather': 17.0,
    'Steel': 2.8, 'Aluminum': 8.2, 'Plastic': 3.5, 'Glass': 0.9,
    'Paper': 1.3, 'Wood': 0.5,
    'Beef': 27.0, 'Lamb': 24.0, 'Pork': 12.1, 'Chicken': 6.9, 'Turkey': 10.9,
    'Fish_Farmed': 5.1, 'Fish_Wild': 2.9, 'Shrimp': 18.0,
    'Milk': 1.9, 'Cheese': 13.5, 'Eggs': 4.8, 'Butter': 12.0,
    'Tofu': 2.0, 'Lentils': 0.9, 'Beans': 1.0, 'Nuts': 2.3,
    'Rice': 4.0, 'Wheat': 1.4, 'Oats': 1.6, 'Corn': 1.1,
    'Tomatoes': 2.1, 'Potatoes': 0.5, 'Lettuce': 0.9, 'Apples': 0.4, 'Bananas': 0.7,
}
TRANSPORT = {'AIR': 0.95, 'SEA': 0.015, 'ROAD': 0.12, 'RAIL': 0.025}
MFG = {'LOW': 0.5, 'MEDIUM': 1.5, 'HIGH': 3.5}


class CarbonFootprintService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        if XGB_PATH.exists():
            self.kind = 'xgb'
            self._artifacts = joblib.load(XGB_PATH)
            self._setup_explainer()
            print(f"[predictor] XGBoost loaded. R²={self._artifacts['metrics']['r2']:.4f}")
        elif RF_PATH.exists():
            self.kind = 'rf'
            self._artifacts = joblib.load(RF_PATH)
            self._explainer = None
            print(f"[predictor] RandomForest fallback. R²={self._artifacts['metrics']['r2_score']:.4f}")
        else:
            raise FileNotFoundError(
                "No model found. Run `python predictor/training/train_xgboost.py` first."
            )

    def _setup_explainer(self):
        from predictor.explanations import Explainer
        self._explainer = Explainer(
            model=self._artifacts['model_main'],
            background=self._artifacts['shap_background'],
            feature_names=self._artifacts['feature_names'],
        )

    def predict(self, material, weight_kg, transport_mode, transport_distance_km,
                manufacturing_intensity='MEDIUM', country='USA', eol='LANDFILL'):
        try:
            if self.kind == 'xgb':
                return self._predict_xgb(material, weight_kg, transport_mode,
                                         transport_distance_km, manufacturing_intensity,
                                         country, eol)
            return self._predict_rf(material, weight_kg, transport_mode,
                                    transport_distance_km, manufacturing_intensity)
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def _predict_xgb(self, material, weight_kg, transport_mode, distance_km,
                     intensity, country, eol):
        enc = self._artifacts['encoders']
        x = np.array([[
            int(enc['material'].transform([material])[0]),
            float(weight_kg),
            int(enc['transport_mode'].transform([transport_mode])[0]),
            float(distance_km),
            int(enc['manufacturing_intensity'].transform([intensity])[0]),
            int(enc['country'].transform([country])[0]),
            int(enc['eol'].transform([eol])[0]),
        ]])

        predicted = max(0.0, float(self._artifacts['model_main'].predict(x)[0]))
        lower_raw = float(self._artifacts['model_lower'].predict(x)[0])
        upper_raw = float(self._artifacts['model_upper'].predict(x)[0])

        q_hat = float(self._artifacts.get('conformal_q_hat', 0.0))
        lower = max(0.0, lower_raw - q_hat)
        upper = max(0.0, upper_raw + q_hat)

        raw_values = {
            'material': material, 'weight_kg': weight_kg,
            'transport_mode': transport_mode, 'transport_distance_km': distance_km,
            'manufacturing_intensity': intensity, 'country': country, 'eol': eol,
        }
        explanations = self._explainer.explain(x[0], raw_values=raw_values) if self._explainer else []

        return {
            'success': True,
            'model': self._artifacts.get('version', 'xgboost'),
            'co2_kg': round(predicted, 2),
            'confidence_interval': {
                'lower': round(lower, 2),
                'upper': round(upper, 2),
                'method': 'conformalized-quantile-regression-90%' if q_hat > 0 else 'quantile-regression-90%',
                'conformal_offset': round(q_hat, 3),
            },
            'breakdown': self._breakdown(material, weight_kg, transport_mode, distance_km, intensity),
            'compensation': self._compensation(predicted),
            'equivalency': self._equivalency(predicted),
            'explanations': explanations,
            'sustainability_rating': self._rating(predicted, weight_kg),
        }

    def _predict_rf(self, material, weight_kg, transport_mode, distance_km, intensity):
        a = self._artifacts
        x = np.array([[
            a['material_encoder'].transform([material])[0],
            float(weight_kg),
            a['transport_encoder'].transform([transport_mode])[0],
            float(distance_km),
            a['intensity_encoder'].transform([intensity])[0],
        ]])
        predicted = max(0.0, float(a['model'].predict(x)[0]))
        return {
            'success': True,
            'model': 'random-forest-v1',
            'co2_kg': round(predicted, 2),
            'confidence_interval': {
                'lower': round(predicted * 0.92, 2),
                'upper': round(predicted * 1.08, 2),
                'method': 'hardcoded-8pct',
                'conformal_offset': 0.0,
            },
            'breakdown': self._breakdown(material, weight_kg, transport_mode, distance_km, intensity),
            'compensation': self._compensation(predicted),
            'equivalency': self._equivalency(predicted),
            'sustainability_rating': self._rating(predicted, weight_kg),
        }

    def _breakdown(self, material, weight_kg, transport_mode, distance_km, intensity):
        mco = weight_kg * MATERIAL_FACTORS.get(material, 3.0)
        mfgco = weight_kg * MFG.get(intensity, 1.5) * 1.4
        tco = weight_kg * (distance_km / 1000) * TRANSPORT.get(transport_mode, 0.1)
        total = max(mco + mfgco + tco, 0.001)
        return {
            'materials_percent': round((mco / total) * 100, 1),
            'manufacturing_percent': round((mfgco / total) * 100, 1),
            'transport_percent': round((tco / total) * 100, 1),
            'material_co2': round(mco, 2),
            'manufacturing_co2': round(mfgco, 2),
            'transport_co2': round(tco, 2),
        }

    def _compensation(self, co2_kg):
        trees = co2_kg / 20
        return {
            'trees_per_year': max(round(trees, 2), 0.01),
            'trees_display': max(int(np.ceil(trees)), 1),
            'rec_credits': round(co2_kg / 1000, 3),
            'days_vegan': round(co2_kg / 2.5, 1),
            'message': f"Plant {max(int(np.ceil(trees)), 1)} tree(s) to offset",
        }

    def _equivalency(self, co2_kg):
        return {
            'car_km': round(co2_kg / 0.25, 1),
            'smartphone_charges': int(co2_kg / 0.008),
            'washing_loads': round(co2_kg / 0.6, 1),
            'display': f"Driving {round(co2_kg / 0.25, 1)} km in an average car",
        }

    def _rating(self, co2_kg, weight_kg):
        intensity = co2_kg / max(weight_kg, 0.01)
        if intensity < 2: grade, label = 'A', 'Excellent'
        elif intensity < 5: grade, label = 'B', 'Good'
        elif intensity < 10: grade, label = 'C', 'Average'
        elif intensity < 20: grade, label = 'D', 'Below Average'
        else: grade, label = 'E', 'High Impact'
        return {'grade': grade, 'label': label, 'intensity_kg_co2_per_kg': round(intensity, 2)}

    def get_available_materials(self):
        if self.kind == 'xgb':
            return list(self._artifacts['encoders']['material'].classes_)
        return list(self._artifacts['material_encoder'].classes_)

    def get_model_info(self):
        m = self._artifacts['metrics']
        if self.kind == 'xgb':
            return {
                'model_family': 'XGBoost + Conformal Quantile Regression',
                'r2_score': m['r2'], 'rmse': m['rmse'], 'mae': m['mae'],
                'interval_coverage_90': m.get('interval_coverage_90'),
                'conformal_coverage_90': m.get('conformal_coverage_90'),
                'feature_names': self._artifacts['feature_names'],
            }
        return {
            'model_family': 'RandomForest', 'r2_score': m['r2_score'],
            'rmse': m['rmse'], 'mae': m['mae'],
            'feature_names': self._artifacts['feature_names'],
        }
