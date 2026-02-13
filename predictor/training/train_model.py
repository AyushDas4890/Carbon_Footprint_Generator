"""
ML Training Script for Carbon Footprint Prediction
Generates synthetic LCA data and trains a Random Forest model
"""
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import os

# Set random seed for reproducibility
np.random.seed(42)

# ====== EMISSION FACTORS (Based on IPCC/EPA Guidelines) ======

MATERIAL_FACTORS = {
    # Manufacturing Materials: (kg CO2e per kg, manufacturing intensity multiplier)
    'Cotton': (5.5, 1.3),
    'Polyester': (6.2, 1.5),
    'Wool': (10.4, 1.4),
    'Leather': (17.0, 2.0),
    'Steel': (2.8, 1.8),
    'Aluminum': (8.2, 2.5),
    'Plastic': (3.5, 1.6),
    'Glass': (0.9, 1.2),
    'Paper': (1.3, 1.0),
    'Wood': (0.5, 0.8),
    
    # Animal Products (High Emissions - Scientific Research Data)
    'Beef': (27.0, 1.2),           # Ruminant livestock - very high methane
    'Lamb': (24.0, 1.2),           # Ruminant livestock
    'Pork': (12.1, 1.1),           # Monogastric - lower than ruminants
    'Chicken': (6.9, 1.0),         # Most efficient meat
    'Turkey': (10.9, 1.0),         # Poultry
    
    # Seafood
    'Fish_Farmed': (5.1, 0.9),     # Aquaculture
    'Fish_Wild': (2.9, 0.8),       # Wild-caught (fuel for boats)
    'Shrimp': (18.0, 1.3),         # High emissions from farming
    
    # Dairy & Eggs
    'Milk': (1.9, 0.7),            # Dairy cows
    'Cheese': (13.5, 1.0),         # Concentrated dairy product
    'Eggs': (4.8, 0.9),            # Chickens
    'Butter': (12.0, 0.9),         # High fat dairy
    
    # Plant-Based Proteins
    'Tofu': (2.0, 0.8),            # Soy-based
    'Lentils': (0.9, 0.6),         # Legumes - carbon sequestering
    'Beans': (1.0, 0.6),           # Legumes
    'Nuts': (2.3, 0.7),            # Tree nuts
    
    # Grains & Staples
    'Rice': (4.0, 0.8),            # Methane from paddies
    'Wheat': (1.4, 0.7),           # Grains
    'Oats': (1.6, 0.7),            # Grains
    'Corn': (1.1, 0.7),            # Maize
    
    # Vegetables & Fruits
    'Tomatoes': (2.1, 0.6),        # Greenhouse heating
    'Potatoes': (0.5, 0.5),        # Low emissions
    'Lettuce': (0.9, 0.5),         # Leafy greens
    'Apples': (0.4, 0.5),          # Fruit
    'Bananas': (0.7, 0.5),         # Tropical fruit
}

TRANSPORT_FACTORS = {
    # Mode: kg CO2e per kg per 1000 km
    'AIR': 0.95,
    'SEA': 0.015,
    'ROAD': 0.12,
    'RAIL': 0.025,
}

MANUFACTURING_BASE = {
    'LOW': 0.5,      # Assembly, packaging
    'MEDIUM': 1.5,   # Standard manufacturing
    'HIGH': 3.5,     # Smelting, chemical processing
}

def calculate_carbon_footprint(material, weight_kg, transport_mode, distance_km, manufacturing_intensity):
    """
    Calculate total carbon footprint based on LCA principles
    
    Formula:
    Total CO2e = Material Emissions + Manufacturing Emissions + Transport Emissions
    """
    # Material emissions
    material_factor, mfg_multiplier = MATERIAL_FACTORS[material]
    material_co2 = weight_kg * material_factor
    
    # Manufacturing emissions
    mfg_base = MANUFACTURING_BASE[manufacturing_intensity]
    manufacturing_co2 = weight_kg * mfg_base * mfg_multiplier
    
    # Transport emissions
    transport_factor = TRANSPORT_FACTORS[transport_mode]
    transport_co2 = weight_kg * (distance_km / 1000) * transport_factor
    
    total_co2 = material_co2 + manufacturing_co2 + transport_co2
    
    return {
        'total': total_co2,
        'material': material_co2,
        'manufacturing': manufacturing_co2,
        'transport': transport_co2
    }

def generate_synthetic_dataset(num_samples=5000):
    """Generate realistic synthetic training data"""
    data = []
    
    materials = list(MATERIAL_FACTORS.keys())
    transport_modes = list(TRANSPORT_FACTORS.keys())
    intensities = list(MANUFACTURING_BASE.keys())
    
    for i in range(num_samples):
        # Realistic distributions
        material = np.random.choice(materials)
        weight = np.random.lognormal(0.5, 1.2)  # Most products 0.1-10 kg
        weight = np.clip(weight, 0.05, 100)
        
        transport_mode = np.random.choice(transport_modes, p=[0.1, 0.3, 0.45, 0.15])
        
        # Distance varies by transport mode
        if transport_mode == 'AIR':
            distance = np.random.uniform(2000, 15000)
        elif transport_mode == 'SEA':
            distance = np.random.uniform(5000, 20000)
        elif transport_mode == 'ROAD':
            distance = np.random.uniform(50, 3000)
        else:  # RAIL
            distance = np.random.uniform(200, 5000)
        
        # Manufacturing intensity correlates with material
        if material in ['Aluminum', 'Steel', 'Leather']:
            intensity = np.random.choice(['MEDIUM', 'HIGH'], p=[0.3, 0.7])
        elif material in ['Cotton', 'Polyester', 'Plastic']:
            intensity = np.random.choice(['LOW', 'MEDIUM'], p=[0.6, 0.4])
        elif material in ['Beef', 'Lamb', 'Pork', 'Shrimp', 'Cheese']:
            # High-emission foods - processing varies
            intensity = np.random.choice(['MEDIUM', 'HIGH'], p=[0.5, 0.5])
        elif material in ['Chicken', 'Fish_Farmed', 'Fish_Wild', 'Tofu', 'Lentils', 'Beans', 
                          'Rice', 'Wheat', 'Potatoes', 'Apples', 'Bananas']:
            # Lower processing foods
            intensity = np.random.choice(['LOW', 'MEDIUM'], p=[0.7, 0.3])
        else:
            intensity = np.random.choice(intensities)
        
        # Calculate carbon footprint
        footprint = calculate_carbon_footprint(material, weight, transport_mode, distance, intensity)
        
        # Add realistic noise (±5%)
        noise_factor = np.random.normal(1.0, 0.05)
        total_co2 = footprint['total'] * noise_factor
        
        data.append({
            'material': material,
            'weight_kg': round(weight, 3),
            'transport_mode': transport_mode,
            'transport_distance_km': round(distance, 1),
            'manufacturing_intensity': intensity,
            'material_co2': round(footprint['material'], 3),
            'manufacturing_co2': round(footprint['manufacturing'], 3),
            'transport_co2': round(footprint['transport'], 3),
            'total_co2_kg': round(total_co2, 3)
        })
    
    return pd.DataFrame(data)

def train_model(df):
    """Train Random Forest model"""
    print("🌍 Training Carbon Footprint Prediction Model...")
    print(f"Dataset size: {len(df)} samples\n")
    
    # Encode categorical features
    le_material = LabelEncoder()
    le_transport = LabelEncoder()
    le_intensity = LabelEncoder()
    
    df['material_encoded'] = le_material.fit_transform(df['material'])
    df['transport_encoded'] = le_transport.fit_transform(df['transport_mode'])
    df['intensity_encoded'] = le_intensity.fit_transform(df['manufacturing_intensity'])
    
    # Features and target
    X = df[['material_encoded', 'weight_kg', 'transport_encoded', 'transport_distance_km', 'intensity_encoded']]
    y = df['total_co2_kg']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Random Forest
    model = RandomForestRegressor(
        n_estimators=150,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    train_r2 = r2_score(y_train, y_pred_train)
    test_r2 = r2_score(y_test, y_pred_test)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    test_mae = mean_absolute_error(y_test, y_pred_test)
    
    print("📊 Model Performance:")
    print(f"  Train R²: {train_r2:.4f}")
    print(f"  Test R²:  {test_r2:.4f}")
    print(f"  Test RMSE: {test_rmse:.4f} kg CO2e")
    print(f"  Test MAE:  {test_mae:.4f} kg CO2e\n")
    
    # Feature importance
    feature_names = ['Material', 'Weight', 'Transport Mode', 'Distance', 'Manufacturing']
    importances = model.feature_importances_
    
    print("🎯 Feature Importance:")
    for name, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True):
        print(f"  {name}: {imp:.3f}")
    
    # Save model and encoders
    model_artifacts = {
        'model': model,
        'material_encoder': le_material,
        'transport_encoder': le_transport,
        'intensity_encoder': le_intensity,
        'feature_names': feature_names,
        'metrics': {
            'r2_score': test_r2,
            'rmse': test_rmse,
            'mae': test_mae
        }
    }
    
    return model_artifacts, df

def main():
    print("=" * 60)
    print("  CARBON FOOTPRINT ML MODEL TRAINING")
    print("=" * 60)
    print()
    
    # Generate dataset
    print("📝 Generating synthetic training dataset...")
    df = generate_synthetic_dataset(num_samples=8000)
    print(f"✅ Generated {len(df)} samples\n")
    
    # Show sample statistics
    print("📈 Dataset Statistics:")
    print(f"  CO2 Range: {df['total_co2_kg'].min():.2f} - {df['total_co2_kg'].max():.2f} kg")
    print(f"  CO2 Mean:  {df['total_co2_kg'].mean():.2f} kg")
    print(f"  CO2 Median: {df['total_co2_kg'].median():.2f} kg\n")
    
    # Train model
    model_artifacts, df = train_model(df)
    
    # Save model
    output_path = os.path.join('predictor', 'ml_models', 'carbon_model.joblib')
    joblib.dump(model_artifacts, output_path)
    print(f"\n✅ Model saved to: {output_path}")
    
    # Save dataset for reference
    dataset_path = os.path.join('predictor', 'training', 'training_data.csv')
    df.to_csv(dataset_path, index=False)
    print(f"✅ Training data saved to: {dataset_path}")
    
    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE!")
    print("=" * 60)

if __name__ == '__main__':
    main()
