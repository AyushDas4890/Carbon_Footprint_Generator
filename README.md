# C4Future - Carbon Footprint Generator

An AI-powered sustainability tool that calculates the carbon footprint of products using a custom Random Forest machine learning model.

## 🚀 Overview

C4Future helps users understand the environmental impact of their products by analyzing materials, manufacturing processes, and transportation logistics. It provides detailed emission breakdowns and actionable offset recommendations to help build a sustainable tomorrow.

## ✨ Key Features

- **AI Predictions**: Uses a Random Forest Regressor to estimate CO2 emissions based on product attributes.
- **Detailed Breakdowns**: Segregates emissions into Materials, Manufacturing, and Transport categories.
- **Interactive Insights**: Visualizes emission factors with dynamic Chart.js dashboards.
- **Offset Strategies**: Calculates how many trees or renewable energy credits are needed to neutralize a footprint.
- **Real-world Equivalencies**: Translates CO2kg into relatable metrics like car kilometers or smartphone charges.

## 🛠️ Technology Stack

- **Backend**: Django (Python)
- **Frontend**: Vanilla JS, HTML5, CSS3 (Glassmorphism design)
- **Machine Learning**: Scikit-learn (Random Forest), Pandas, NumPy
- **Visualizations**: Chart.js
- **Database**: SQLite3

## 📦 Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd CarbonFootprintGenerator
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Start the Development Server**:
   ```bash
   python manage.py runServer
   ```
6. **Retrain the Model (Optional)**:
   If you wish to update the model with new data:
   ```bash
   python predictor/training/train_model.py
   ```

## 📊 Methodology

The system uses internal emission factors derived from IPCC guidelines and logistical standards to train its ML model. 
- **Materials**: 5.5 kg CO2/kg for Cotton, 17.0 for Leather, etc.
- **Transport**: Air (0.95), Sea (0.015), Road (0.12) kg CO2/ton-km.
- **Manufacturing**: Variable based on process intensity (Low, Medium, High).

---
© 2026 C4Future — Building a Sustainable Tomorrow
