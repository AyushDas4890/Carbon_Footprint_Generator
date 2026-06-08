"""
Conformal prediction calibration for quantile-regression intervals.

The problem we're solving:
  Our raw quantile-regression intervals achieved only 78% coverage on the
  held-out eval set vs the nominal 90% target. That's a classic "quantile
  regression is not exchangeable" failure — the model's idea of the 5th
  and 95th percentile doesn't match reality.

The fix (Conformalized Quantile Regression — Romano, Patterson, Candès 2019):
  1. Hold out a calibration set the model never saw during training.
  2. Compute per-sample conformity scores:
        s_i = max(lower_pred_i - y_i, y_i - upper_pred_i)
     (positive when the true value falls outside the predicted interval).
  3. Take the (1 - α)-quantile q̂ of these scores across the calibration set.
  4. At inference, output [lower_pred - q̂, upper_pred + q̂] — guaranteed to
     have ≥ (1 - α) coverage by exchangeability.

Why this matters for CV:
  - Conformal prediction is a hot-but-not-yet-mainstream technique.
  - It signals you understand WHY raw quantile regression undercovers.
  - Provable coverage guarantees are gold for risk-sensitive applications
    (carbon accounting, healthcare, finance).
"""
from __future__ import annotations

import numpy as np
from typing import Tuple


def fit_conformal_offset(
    y_true: np.ndarray,
    y_lower: np.ndarray,
    y_upper: np.ndarray,
    alpha: float = 0.10,
) -> float:
    """Compute the conformal offset q̂ on a calibration set.

    Args:
        y_true:  true target values, shape (n,)
        y_lower: raw lower-quantile predictions, shape (n,)
        y_upper: raw upper-quantile predictions, shape (n,)
        alpha:   miscoverage rate (0.10 → 90% interval)

    Returns:
        Scalar q̂ to be added to upper and subtracted from lower at inference.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_lower = np.asarray(y_lower, dtype=float)
    y_upper = np.asarray(y_upper, dtype=float)

    scores = np.maximum(y_lower - y_true, y_true - y_upper)
    n = len(scores)
    # Finite-sample correction: use ceil((n+1)*(1-α))/n quantile
    q_level = min(1.0, np.ceil((n + 1) * (1 - alpha)) / n)
    q_hat = float(np.quantile(scores, q_level))
    return q_hat


def evaluate_coverage(
    y_true: np.ndarray,
    y_lower: np.ndarray,
    y_upper: np.ndarray,
) -> Tuple[float, float]:
    """Returns (empirical_coverage, mean_interval_width)."""
    y_true = np.asarray(y_true)
    y_lower = np.asarray(y_lower)
    y_upper = np.asarray(y_upper)
    coverage = float(np.mean((y_true >= y_lower) & (y_true <= y_upper)))
    width = float(np.mean(y_upper - y_lower))
    return coverage, width


def apply_conformal(
    y_lower: np.ndarray,
    y_upper: np.ndarray,
    q_hat: float,
) -> Tuple[np.ndarray, np.ndarray]:
    """Symmetrically widen intervals by q̂."""
    return y_lower - q_hat, y_upper + q_hat
