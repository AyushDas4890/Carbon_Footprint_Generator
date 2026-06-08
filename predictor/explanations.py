"""
SHAP-based per-prediction explanations.

Why this matters for interviews:
  - Tree SHAP gives *exact* feature attributions: "the airfreight added 14 kg,
    the high-grid country added 6 kg, the heavy weight added 9 kg".
  - That's the difference between a black-box predictor and a transparent
    decision-support tool. Recruiters specifically ask about model
    interpretability — this is the answer.
"""
from typing import List, Dict, Optional
import numpy as np


class Explainer:
    """Lazy-loaded SHAP TreeExplainer for the XGBoost models."""

    def __init__(self, model, background: np.ndarray, feature_names: List[str]):
        self.model = model
        self.background = background
        self.feature_names = feature_names
        self._explainer = None

    def _get(self):
        if self._explainer is None:
            try:
                import shap
                # TreeExplainer is exact + fast for XGBoost
                self._explainer = shap.TreeExplainer(self.model)
            except ImportError:
                return None
        return self._explainer

    def explain(self, x_row: np.ndarray, raw_values: Optional[Dict] = None) -> List[Dict]:
        """Return per-feature contributions for one prediction.

        Args:
            x_row: encoded feature vector, shape (n_features,)
            raw_values: dict mapping feature_name → human-readable value
                (e.g. {'material': 'Cotton', 'weight_kg': 0.5}) for UI display
        """
        exp = self._get()
        if exp is None:
            # Fallback: feature importances (global, not per-prediction)
            return self._fallback()

        shap_vals = exp.shap_values(x_row.reshape(1, -1))[0]
        base_value = float(getattr(exp, "expected_value", 0.0))

        out = []
        for i, (name, contrib) in enumerate(zip(self.feature_names, shap_vals)):
            display = name.replace('_enc', '').replace('_', ' ').title()
            raw = (raw_values or {}).get(name.replace('_enc', ''), None)
            out.append({
                'feature': display,
                'contribution_kg_co2': round(float(contrib), 3),
                'value': raw,
            })
        # Sort biggest impact first (positive or negative)
        out.sort(key=lambda d: abs(d['contribution_kg_co2']), reverse=True)
        return out + [{'feature': 'BASE (avg prediction)',
                       'contribution_kg_co2': round(base_value, 3),
                       'value': None}]

    def _fallback(self) -> List[Dict]:
        imp = getattr(self.model, 'feature_importances_', None)
        if imp is None:
            return []
        return [
            {'feature': n.replace('_enc', '').replace('_', ' ').title(),
             'contribution_kg_co2': float(v), 'value': None}
            for n, v in zip(self.feature_names, imp)
        ]
