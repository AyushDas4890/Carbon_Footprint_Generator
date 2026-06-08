"""
XGBoost training with quantile regression + conformal prediction + SHAP.

What's special:
  - Real data: loads `training_data_hybrid.csv` (synthetic + real Agribalyse)
  - Product-level held-out eval set with zero leakage
  - Three models: median + two quantiles → empirical 90% interval
  - Conformal calibration → guaranteed coverage on the eval distribution
  - SHAP background sampled for per-prediction explanations at inference
"""
import os
import sys
import json
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb

np.random.seed(42)
HERE = Path(__file__).resolve().parent
PROJECT_ROOT = HERE.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))   # so `from predictor.x` works

HYBRID_CSV = HERE / "training_data_hybrid.csv"
REAL_EVAL_CSV = HERE / "real_eval.csv"

CATEGORICAL = ['material', 'transport_mode', 'manufacturing_intensity', 'country', 'eol']
FEATURE_COLS = [
    'material_enc', 'weight_kg', 'transport_mode_enc',
    'transport_distance_km', 'manufacturing_intensity_enc',
    'country_enc', 'eol_enc',
]


def load_training_data():
    override = os.getenv('EXTERNAL_LCA_CSV')
    if override and Path(override).exists():
        print(f"[data] Using EXTERNAL_LCA_CSV: {override}")
        return pd.read_csv(override)
    if HYBRID_CSV.exists():
        df = pd.read_csv(HYBRID_CSV)
        print(f"[data] Loaded {len(df)} rows from {HYBRID_CSV.name}")
        if 'source' in df.columns:
            for src, n in df['source'].value_counts().items():
                print(f"        {src:25s} {n}")
        return df
    sys.exit("[data] No training data. Run `python predictor/training/data_adapter.py` first.")


def load_real_eval():
    if REAL_EVAL_CSV.exists():
        df = pd.read_csv(REAL_EVAL_CSV)
        print(f"[data] Loaded {len(df)} held-out real eval rows")
        return df
    return None


def fit_encoders(*dfs):
    encoders = {}
    for col in CATEGORICAL:
        vals = pd.concat([d[col] for d in dfs if col in d.columns], ignore_index=True)
        le = LabelEncoder(); le.fit(vals.astype(str))
        encoders[col] = le
    return encoders


def transform(df, encoders):
    out = df.copy()
    for col in CATEGORICAL:
        out[col + '_enc'] = encoders[col].transform(out[col].astype(str))
    return out[FEATURE_COLS].values, out['total_co2_kg'].values


def train_xgb(X, y, quantile_alpha=None):
    params = dict(n_estimators=400, learning_rate=0.06, max_depth=7,
                  min_child_weight=3, subsample=0.85, colsample_bytree=0.85,
                  random_state=42, n_jobs=-1, tree_method='hist')
    if quantile_alpha is not None:
        params['objective'] = 'reg:quantileerror'
        params['quantile_alpha'] = quantile_alpha
    else:
        params['objective'] = 'reg:squarederror'
    m = xgb.XGBRegressor(**params)
    m.fit(X, y, verbose=False)
    return m


def evaluate(model, X, y, lower=None, upper=None, label="set", q_hat=0.0):
    pred = model.predict(X)
    r2 = float(r2_score(y, pred)) if len(y) > 1 else float('nan')
    rmse = float(np.sqrt(mean_squared_error(y, pred)))
    mae = float(mean_absolute_error(y, pred))
    out = {'n': int(len(y)), 'r2': r2, 'rmse': rmse, 'mae': mae}
    extras = ""
    if lower is not None and upper is not None:
        lo, hi = lower.predict(X), upper.predict(X)
        cov_raw = float(np.mean((y >= lo) & (y <= hi)))
        out['interval_coverage_90_raw'] = cov_raw
        if q_hat > 0:
            lo_c, hi_c = lo - q_hat, hi + q_hat
            cov_c = float(np.mean((y >= lo_c) & (y <= hi_c)))
            out['interval_coverage_90_conformal'] = cov_c
            extras = f"  raw_cov={cov_raw:.2%}  conformal_cov={cov_c:.2%}"
        else:
            extras = f"  raw_cov={cov_raw:.2%}"
    print(f"[eval] {label:25s} n={out['n']:5d}  R2={r2:.4f}  RMSE={rmse:.2f}  MAE={mae:.2f}{extras}")
    return out


def main():
    print("=" * 60)
    print("  XGBoost Carbon Predictor — v3 (Real Data + Conformal)")
    print("=" * 60)

    df = load_training_data()
    eval_real = load_real_eval()

    # Union encoders so real eval categories don't break inference
    encoders = fit_encoders(df, eval_real if eval_real is not None else df)
    X, y = transform(df, encoders)

    # Train / calibration / test = 60 / 20 / 20
    X_tr, X_rest, y_tr, y_rest = train_test_split(X, y, test_size=0.4, random_state=42)
    X_cal, X_te, y_cal, y_te = train_test_split(X_rest, y_rest, test_size=0.5, random_state=42)
    print(f"[split] train={len(X_tr)}  calib={len(X_cal)}  test={len(X_te)}")

    print("[train] Median predictor...")
    m_main = train_xgb(X_tr, y_tr)
    print("[train] Lower quantile (alpha=0.05)...")
    m_lower = train_xgb(X_tr, y_tr, quantile_alpha=0.05)
    print("[train] Upper quantile (alpha=0.95)...")
    m_upper = train_xgb(X_tr, y_tr, quantile_alpha=0.95)

    # Conformal calibration on the held-out calib set
    from predictor.calibration import fit_conformal_offset, evaluate_coverage
    cal_lo, cal_hi = m_lower.predict(X_cal), m_upper.predict(X_cal)
    raw_cov, raw_w = evaluate_coverage(y_cal, cal_lo, cal_hi)
    q_hat = fit_conformal_offset(y_cal, cal_lo, cal_hi, alpha=0.10)
    adj_cov, adj_w = evaluate_coverage(y_cal, cal_lo - q_hat, cal_hi + q_hat)
    print(f"\n[calibrate] q_hat={q_hat:.3f}  coverage {raw_cov:.2%} -> {adj_cov:.2%}  width {raw_w:.2f} -> {adj_w:.2f}\n")

    # Eval
    metrics = {'conformal_q_hat': q_hat}
    metrics['train_synthetic_test'] = evaluate(m_main, X_te, y_te, m_lower, m_upper, "synthetic-test", q_hat)
    if eval_real is not None:
        Xe, ye = transform(eval_real, encoders)
        metrics['real_eval'] = evaluate(m_main, Xe, ye, m_lower, m_upper, "real-eval (held-out)", q_hat)

    # SHAP background
    bg = X_tr[np.random.choice(len(X_tr), size=min(200, len(X_tr)), replace=False)]

    # Save
    out_dir = PROJECT_ROOT / 'predictor' / 'ml_models'; out_dir.mkdir(exist_ok=True)
    main_m = metrics.get('real_eval') or metrics['train_synthetic_test']
    legacy = {
        'r2': main_m['r2'], 'rmse': main_m['rmse'], 'mae': main_m['mae'],
        'n_train': int(len(X_tr)), 'n_test': int(len(X_te)),
        'interval_coverage_90': main_m.get('interval_coverage_90_raw', 0.0),
        'conformal_coverage_90': main_m.get('interval_coverage_90_conformal', 0.0),
    }
    artifacts = {
        'version': 'xgb-v3-realdata-conformal',
        'model_main': m_main, 'model_lower': m_lower, 'model_upper': m_upper,
        'conformal_q_hat': q_hat,
        'encoders': encoders, 'feature_names': FEATURE_COLS,
        'shap_background': bg,
        'metrics': legacy, 'metrics_full': metrics,
    }
    joblib.dump(artifacts, out_dir / 'carbon_xgb.joblib')
    (out_dir / 'metrics_xgb.json').write_text(json.dumps(metrics, indent=2))
    print(f"\n[save] {out_dir / 'carbon_xgb.joblib'}")
    print(f"[save] {out_dir / 'metrics_xgb.json'}")

    if 'real_eval' in metrics:
        m = metrics['real_eval']
        print(f"\n>>> Real-world held-out R2 = {m['r2']:.4f}")
        print(f">>> Real-world held-out MAE = {m['mae']:.2f} kg CO2e")
        print(f">>> Raw 90% coverage        = {m.get('interval_coverage_90_raw', 0):.2%}")
        print(f">>> Conformal 90% coverage  = {m.get('interval_coverage_90_conformal', 0):.2%}")
    print("=" * 60)

    # --- Optional MLflow run logging ---
    # Set MLFLOW_TRACKING_URI in your .env to activate.
    # e.g. MLFLOW_TRACKING_URI=./mlruns   → local file-system store
    #      MLFLOW_TRACKING_URI=http://localhost:5000  → remote server
    #
    # Start the MLflow UI with:  mlflow ui --backend-store-uri ./mlruns
    mlflow_uri = os.getenv('MLFLOW_TRACKING_URI', '').strip()
    if mlflow_uri:
        try:
            import mlflow
            mlflow.set_tracking_uri(mlflow_uri)
            mlflow.set_experiment("c4future-carbon-predictor")
            with mlflow.start_run(run_name="xgb-v3-realdata-conformal"):
                # Hyper-params
                mlflow.log_params({
                    "n_estimators": 400,
                    "learning_rate": 0.06,
                    "max_depth": 7,
                    "conformal_alpha": 0.10,
                    "conformal_q_hat": round(float(q_hat), 4),
                    "n_train": len(X_tr),
                    "n_cal": len(X_cal),
                    "n_test": len(X_te),
                })
                # Synthetic-test metrics
                s = metrics['train_synthetic_test']
                mlflow.log_metrics({
                    "synthetic_r2": round(s['r2'], 4),
                    "synthetic_mae": round(s['mae'], 4),
                    "synthetic_rmse": round(s['rmse'], 4),
                    "synthetic_interval_cov_raw": round(s.get('interval_coverage_90_raw', 0), 4),
                    "synthetic_interval_cov_conformal": round(s.get('interval_coverage_90_conformal', 0), 4),
                })
                # Real held-out metrics (the ones that matter)
                if 'real_eval' in metrics:
                    r = metrics['real_eval']
                    mlflow.log_metrics({
                        "real_r2": round(r['r2'], 4),
                        "real_mae": round(r['mae'], 4),
                        "real_rmse": round(r['rmse'], 4),
                        "real_interval_cov_raw": round(r.get('interval_coverage_90_raw', 0), 4),
                        "real_interval_cov_conformal": round(r.get('interval_coverage_90_conformal', 0), 4),
                    })
                # Log the serialised model artifact
                model_path = str(out_dir / 'carbon_xgb.joblib')
                mlflow.log_artifact(model_path, artifact_path="model")
                mlflow.log_artifact(str(out_dir / 'metrics_xgb.json'), artifact_path="metrics")
            print(f"[mlflow] Run logged → {mlflow_uri}")
        except ImportError:
            print("[mlflow] mlflow not installed — skipping. Run: pip install mlflow")
        except Exception as exc:
            print(f"[mlflow] Logging failed (non-fatal): {exc}")
    else:
        print("[mlflow] MLFLOW_TRACKING_URI not set — skipping run logging.")
        print("         Set it in .env to enable experiment tracking.")


if __name__ == '__main__':
    sys.exit(main())
