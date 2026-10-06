# 🚶 Project Walkthrough: Carbon Footprint Generator

This document provides a step-by-step guide on how the application functions, from the user interface to the machine learning backend.

---

## 🏠 1. The Landing Page (Home)
When you first open the app (`/`), you are greeted with an editorial, print-style interface: a rotating dotted globe in the hero, then the calculator further down the page.

- **Action**: The user enters a **Product Name**, selects a **Material**, defines the **Weight**, chooses a **Transport Mode**, and specifies the **Distance**.
- **Under the Hood**: 
    - The React app requests `/api/materials/`, which asks the `CarbonFootprintService` for the materials the ML model's encoders know about.
    - This ensures the UI only allows inputs that the model has been trained to understand.

## ⚡ 2. The Prediction Engine (Real-time AJAX)
When you click "Calculate", the page doesn't refresh. Instead, a background request (AJAX) is sent to the server.

- **Action**: The calculator in `frontend/src/pages/Home.tsx` collects the form data and sends a POST request to `/api/predict/` through `frontend/src/lib/api.ts`.
- **Under the Hood**:
    - `PredictCarbonFootprintView` in `predictor/views.py` receives the data.
    - It validates the inputs (e.g., ensuring weight isn't negative).
    - It invokes `service.predict(...)`.
    - Every prediction is saved to the `PredictionLog` model in the database, allowing for future auditing or analytics.

## 📊 3. The Results Dashboard
Once the server responds, the app stores the result in `sessionStorage` and moves to `/results/` client-side.

- **Action**: The **CO2 Score** is displayed with a "counter" animation next to a draggable carbon pass showing the grade. A segmented bar breaks the total down by stage (Material production vs. Manufacturing vs. Transport), and a diverging bar chart shows which inputs pushed the number up or down.
- **Under the Hood**:
    - The service calculates these percentages based on internal emission factors (e.g., `material_co2 = weight * factor`).
    - The "Compensation" section suggests how many trees you'd need to plant, based on the scientific fact that one tree absorbs roughly 20kg of CO2 per year.

## 🧠 4. Model Insights (The "Deep Dive")
The "Insights" page provides a transparent look at how the AI works.

- **Action**: Navigate to the **Insights** tab.
- **Under the Hood**:
    - This page displays the **R² Score**, **MAE** and held-out coverage of the 90% interval directly from the trained model artifacts.
    - It features animated bar charts (`frontend/src/components/ui/Charts.tsx`) that benchmark the last prediction by stage, material intensity and freight mode, and show its 90% interval.

## ⚙️ 5. Administrative Control
Because this is a Django app, it comes with a built-in admin panel.

- **Action**: Visit `/admin` (requires superuser setup).
- **Under the Hood**:
    - You can view every prediction ever made by users in the `PredictionLog` section.
    - This is useful for monitoring usage and seeing which materials are being queried most often.

---

## Summary of Data Flow:
`User Input` ➔ `JS AJAX` ➔ `Django API` ➔ `ML Service (Random Forest)` ➔ `Database Log` ➔ `JSON Response` ➔ `UI Update`

This seamless flow between the frontend and the mathematical backend is what makes C4Future a powerful sustainability tool.
