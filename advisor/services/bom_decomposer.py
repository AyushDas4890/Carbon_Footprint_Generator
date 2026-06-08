"""
Bill-of-Materials decomposer — turns natural language into structured components.

Why this is impressive on a CV:
  - It's a small *agentic* workflow: LLM → structured JSON → ML model loop.
  - Shows you understand "function calling" / structured output without
    needing OpenAI's tool API specifically (works on any LLM).
  - End result: user says "iPhone 15 Pro shipped from China by air" and
    gets a full CO2 estimate broken down by component.

How it works:
  1. Send a strict-format prompt to the LLM asking it to decompose the
     product into materials with weight estimates.
  2. Parse the returned JSON (with a fallback retry on parse error).
  3. For each component, call the predictor service.
  4. Sum + return component-level breakdown + total.
"""
from __future__ import annotations

import json
import re
from typing import Dict, List

from django.conf import settings

from predictor.services import CarbonFootprintService


# Hardcoded but easy to extend — the LLM is allowed to pick from these
SUPPORTED_MATERIALS = [
    'Cotton', 'Polyester', 'Wool', 'Leather', 'Steel', 'Aluminum',
    'Plastic', 'Glass', 'Paper', 'Wood',
    'Beef', 'Lamb', 'Pork', 'Chicken', 'Turkey',
    'Fish_Farmed', 'Fish_Wild', 'Shrimp', 'Milk', 'Cheese', 'Eggs', 'Butter',
    'Tofu', 'Lentils', 'Beans', 'Nuts', 'Rice', 'Wheat', 'Oats', 'Corn',
    'Tomatoes', 'Potatoes', 'Lettuce', 'Apples', 'Bananas',
]


DECOMPOSER_PROMPT = """You are a Life-Cycle Assessment expert. Decompose the
product described by the user into its primary materials with realistic
weight estimates in kilograms.

CONSTRAINTS:
- Use ONLY materials from this list: {materials}
- Weights must sum (approximately) to the total product weight if mentioned.
- Return ONLY valid JSON. No prose, no markdown, no code fences.

FORMAT:
{{
  "product_name": "<short name>",
  "total_weight_kg": <number>,
  "components": [
    {{"material": "<one from list>", "weight_kg": <number>, "role": "<short role>"}}
  ],
  "transport_mode": "AIR" | "SEA" | "ROAD" | "RAIL",
  "transport_distance_km": <number>,
  "manufacturing_intensity": "LOW" | "MEDIUM" | "HIGH"
}}

EXAMPLE input: "iPhone 15 Pro shipped from China by air"
EXAMPLE output:
{{
  "product_name": "iPhone 15 Pro",
  "total_weight_kg": 0.187,
  "components": [
    {{"material": "Aluminum", "weight_kg": 0.045, "role": "Frame"}},
    {{"material": "Glass", "weight_kg": 0.040, "role": "Display + back"}},
    {{"material": "Plastic", "weight_kg": 0.030, "role": "Internals"}},
    {{"material": "Steel", "weight_kg": 0.072, "role": "Battery + connectors"}}
  ],
  "transport_mode": "AIR",
  "transport_distance_km": 11000,
  "manufacturing_intensity": "HIGH"
}}

User request: {user_input}

Return JSON only."""


class BoMDecomposer:
    def __init__(self):
        cfg = settings.ADVISOR_CONFIG
        self.api_key = cfg['OPENAI_API_KEY']
        self.base_url = cfg.get('OPENAI_BASE_URL')
        self.model = cfg['LLM_MODEL']
        self._client = None
        self._predictor = CarbonFootprintService()

    def _client_lazy(self):
        if self._client is None:
            from openai import OpenAI
            kwargs = {"api_key": self.api_key}
            if self.base_url:
                kwargs["base_url"] = self.base_url
            self._client = OpenAI(**kwargs)
        return self._client

    def decompose(self, user_input: str) -> Dict:
        """Ask the LLM for a BoM, parse, validate."""
        prompt = DECOMPOSER_PROMPT.format(
            materials=", ".join(SUPPORTED_MATERIALS),
            user_input=user_input.strip(),
        )
        client = self._client_lazy()
        # response_format=json_object forces JSON output on OpenAI models
        resp = client.chat.completions.create(
            model=self.model, temperature=0.1, max_tokens=900,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
        )
        text = resp.choices[0].message.content or "{}"
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            # Defensive: try to extract first {...} block
            match = re.search(r"\{[\s\S]+\}", text)
            data = json.loads(match.group(0)) if match else {}

        self._validate(data)
        return data

    def _validate(self, data: Dict):
        required = ['components', 'transport_mode', 'transport_distance_km',
                    'manufacturing_intensity']
        for k in required:
            if k not in data:
                raise ValueError(f"LLM output missing required field: {k}")
        for c in data['components']:
            if c.get('material') not in SUPPORTED_MATERIALS:
                raise ValueError(f"Unknown material: {c.get('material')}")
            if not isinstance(c.get('weight_kg'), (int, float)) or c['weight_kg'] <= 0:
                raise ValueError(f"Invalid weight for {c}")

    def predict_full(self, user_input: str, country: str = 'CHINA',
                     eol: str = 'LANDFILL') -> Dict:
        """End-to-end: decompose, predict per component, aggregate.

        Important: XGBoost can predict NEGATIVE values for tiny weights
        (extrapolation outside the training distribution — most products in
        the training set are 0.1-100 kg). We handle this by falling back
        to the analytical breakdown sum (material + manufacturing + transport)
        whenever the model's point estimate is non-positive.
        """
        bom = self.decompose(user_input)

        component_results: List[Dict] = []
        total_co2 = 0.0
        for c in bom['components']:
            r = self._predictor.predict(
                material=c['material'],
                weight_kg=c['weight_kg'],
                transport_mode=bom['transport_mode'],
                transport_distance_km=bom['transport_distance_km'],
                manufacturing_intensity=bom['manufacturing_intensity'],
                country=country, eol=eol,
            )
            if not r.get('success'):
                continue

            co2 = float(r.get('co2_kg', 0.0))

            # Robustness: when the model goes negative/zero (tiny-weight
            # extrapolation), use the deterministic LCA breakdown sum instead.
            if co2 <= 0:
                bd = r.get('breakdown', {})
                co2_fallback = (
                    float(bd.get('material_co2', 0.0))
                    + float(bd.get('manufacturing_co2', 0.0))
                    + float(bd.get('transport_co2', 0.0))
                )
                co2 = max(co2_fallback, 0.001)

            co2 = round(co2, 3)
            total_co2 += co2
            component_results.append({
                'material': c['material'],
                'role': c.get('role', ''),
                'weight_kg': c['weight_kg'],
                'co2_kg': co2,
                'percent_of_total': 0.0,  # filled after totaling
            })

        for cr in component_results:
            cr['percent_of_total'] = round((cr['co2_kg'] / total_co2) * 100, 1) if total_co2 > 0 else 0.0

        return {
            'success': True,
            'product_name': bom.get('product_name', user_input),
            'total_weight_kg': bom.get('total_weight_kg'),
            'total_co2_kg': round(total_co2, 2),
            'components': sorted(component_results, key=lambda x: -x['co2_kg']),
            'context': {
                'transport_mode': bom['transport_mode'],
                'transport_distance_km': bom['transport_distance_km'],
                'manufacturing_intensity': bom['manufacturing_intensity'],
                'country': country,
            },
        }
