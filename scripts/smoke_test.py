"""
End-to-end smoke test — verifies every key piece of the project works.

Run with:
    python scripts/smoke_test.py

Covers:
  1. Calibration math (conformal offset returns sane values)
  2. ML predictor service: loads model + predicts + returns SHAP + interval
  3. Sustainability rating + compare endpoint logic
  4. Data adapter outputs are present & schema-correct
  5. Django check + URL configuration

Skipped (need API key / large downloads):
  - Live RAG chat → needs OPENAI_API_KEY
  - BoM decompose → needs OPENAI_API_KEY
  - Reranker download → needs network for cross-encoder model

Exit code 0 = all passed, non-zero = failure.
"""
import os
import sys
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
os.environ.setdefault("DJANGO_SECRET_KEY", "smoke-test-not-secret")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "carbon_project.settings")

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"

failures = []


def check(name, fn):
    try:
        fn()
        print(f"  {PASS} {name}")
    except Exception as e:
        print(f"  {FAIL} {name}: {e}")
        failures.append((name, str(e)))


# -----------------------------------------------------------------------------
# 1. Calibration math
# -----------------------------------------------------------------------------
def test_calibration():
    """Build undercovered intervals; conformal should widen and hit ~90%."""
    import numpy as np
    from predictor.calibration import fit_conformal_offset, evaluate_coverage, apply_conformal

    np.random.seed(0)
    n = 2000
    y_true = np.random.normal(10, 3, n)
    # Deliberately narrow intervals → ~50% raw coverage
    y_lower = y_true - 1.0 + np.random.normal(0, 0.5, n)
    y_upper = y_true + 1.0 + np.random.normal(0, 0.5, n)

    raw_cov, _ = evaluate_coverage(y_true, y_lower, y_upper)
    q_hat = fit_conformal_offset(y_true, y_lower, y_upper, alpha=0.10)
    new_lo, new_hi = apply_conformal(y_lower, y_upper, q_hat)
    new_cov, _ = evaluate_coverage(y_true, new_lo, new_hi)

    assert q_hat > 0, f"q_hat should be positive when raw coverage is too low ({q_hat=})"
    assert new_cov > raw_cov, f"conformal didn't widen: {raw_cov:.3f} -> {new_cov:.3f}"
    assert new_cov >= 0.85, f"calibrated coverage too low: {new_cov:.3f}"


# -----------------------------------------------------------------------------
# 2. ML predictor service end-to-end
# -----------------------------------------------------------------------------
def test_predictor():
    import django; django.setup()
    from predictor.services import CarbonFootprintService

    svc = CarbonFootprintService()
    r = svc.predict(
        material="Cotton", weight_kg=0.5, transport_mode="AIR",
        transport_distance_km=8000, manufacturing_intensity="MEDIUM",
        country="CHINA", eol="LANDFILL",
    )
    assert r["success"], r.get("error")
    assert r["co2_kg"] > 0, "CO2 should be positive"
    assert "confidence_interval" in r
    assert r["confidence_interval"]["lower"] <= r["co2_kg"] <= r["confidence_interval"]["upper"], \
        f"prediction {r['co2_kg']} outside CI {r['confidence_interval']}"
    assert "explanations" in r and len(r["explanations"]) > 0, "missing SHAP explanations"
    assert "sustainability_rating" in r
    assert r["sustainability_rating"]["grade"] in "ABCDE"


def test_predictor_full_country_range():
    """Predictor must accept every encoded country/EOL combination."""
    from predictor.services import CarbonFootprintService
    svc = CarbonFootprintService()
    for country in ["FRANCE", "CHINA", "UK", "INDIA"]:
        for eol in ["RECYCLED", "INCINERATED", "LANDFILL"]:
            r = svc.predict("Beef", 0.5, "SEA", 6000, "MEDIUM", country, eol)
            assert r["success"], f"{country}/{eol}: {r.get('error')}"


# -----------------------------------------------------------------------------
# 3. Sustainability rating + compare logic
# -----------------------------------------------------------------------------
def test_sustainability_grades():
    from predictor.services import CarbonFootprintService
    svc = CarbonFootprintService()
    # Beef should grade D-E, Apples A-B
    beef = svc.predict("Beef", 0.5, "ROAD", 1000, "MEDIUM", "USA", "LANDFILL")
    apple = svc.predict("Apples", 0.5, "ROAD", 1000, "MEDIUM", "USA", "LANDFILL")
    assert beef["sustainability_rating"]["grade"] in "CDE", \
        f"beef should be C/D/E, got {beef['sustainability_rating']['grade']}"
    assert apple["sustainability_rating"]["grade"] in "AB", \
        f"apple should be A/B, got {apple['sustainability_rating']['grade']}"


# -----------------------------------------------------------------------------
# 4. Data adapter artifacts
# -----------------------------------------------------------------------------
def test_adapter_outputs():
    factors = PROJECT_ROOT / "predictor/training/real_factors.json"
    eval_csv = PROJECT_ROOT / "predictor/training/real_eval.csv"
    hybrid_csv = PROJECT_ROOT / "predictor/training/training_data_hybrid.csv"

    assert factors.exists(), "Run data_adapter.py to generate real_factors.json"
    assert eval_csv.exists(), "real_eval.csv missing"
    assert hybrid_csv.exists(), "training_data_hybrid.csv missing"

    f = json.loads(factors.read_text())
    assert "materials_kg_co2_per_kg" in f
    # Beef should be calibrated from Poore -> ~60 range
    assert 50 <= f["materials_kg_co2_per_kg"]["Beef"] <= 80, \
        f"Beef factor out of range: {f['materials_kg_co2_per_kg']['Beef']}"
    assert "conformal_q_hat" not in f  # this is in metrics, not factors

    # Eval CSV must have product_id to prove the leakage-checked split
    import pandas as pd
    eval_df = pd.read_csv(eval_csv)
    assert "product_id" in eval_df.columns, "eval missing product_id"
    train_df = pd.read_csv(hybrid_csv)
    assert "source" in train_df.columns


# -----------------------------------------------------------------------------
# 5. Django URL conf
# -----------------------------------------------------------------------------
def test_urls():
    from django.urls import reverse
    for name in ["home", "results", "insights", "compare_page", "decompose_page",
                 "advisor", "advisor_chat", "advisor_decompose",
                 "predict", "compare", "materials", "model_info"]:
        path = reverse(name)
        assert path.startswith("/"), f"{name} reverse failed: {path}"


def test_django_check():
    from django.core.management import call_command
    call_command("check")


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("  C4Future smoke test")
    print("=" * 60)
    print("\n[1] Calibration")
    check("conformal_offset widens interval", test_calibration)

    print("\n[2] ML Predictor")
    check("predict() returns SHAP + interval + rating", test_predictor)
    check("predict() supports all country/EOL combos", test_predictor_full_country_range)

    print("\n[3] Sustainability rating logic")
    check("Beef grades C-E, Apples grade A-B", test_sustainability_grades)

    print("\n[4] Data adapter artifacts")
    check("real_factors.json, real_eval.csv, training_data_hybrid.csv exist", test_adapter_outputs)

    print("\n[5] Django wiring")
    check("URL reverse() works for every named route", test_urls)
    check("manage.py check passes", test_django_check)

    print()
    if failures:
        print(f"\033[91m{len(failures)} FAILURES:\033[0m")
        for n, err in failures:
            print(f"  - {n}: {err}")
        sys.exit(1)
    print(f"\033[92mAll smoke tests passed.\033[0m")


if __name__ == "__main__":
    main()
