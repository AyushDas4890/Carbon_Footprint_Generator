#!/usr/bin/env bash
# Release script — runs on every container start (Dockerfile CMD invokes this
# before gunicorn). Idempotent and resilient: each step is wrapped so one
# failure doesn't block the rest.
set +e

echo "[release] === C4Future release script ==="

echo "[release] 1/4  Running database migrations..."
python manage.py migrate --noinput

echo "[release] 2/4  Collecting static files..."
python manage.py collectstatic --noinput --clear

# 3. Train the XGBoost model if it doesn't already exist.
#    The model is .gitignored, so a fresh container always needs to build it.
#    Pre-baking at Docker build time is the fast path; this is the safety net.
MODEL_FILE="predictor/ml_models/carbon_xgb.joblib"
if [ ! -f "$MODEL_FILE" ]; then
    echo "[release] 3/4  Model missing — training XGBoost (~60 s)..."
    python predictor/training/data_adapter.py \
        || echo "[release] data_adapter failed (will retry on next start)"
    python predictor/training/train_xgboost.py \
        || echo "[release] train_xgboost failed (CHECK LOGS — model still missing)"
    if [ -f "$MODEL_FILE" ]; then
        echo "[release]       ✓ Model trained successfully."
    else
        echo "[release]       ✗ Model still missing. App will return 503 until fixed."
    fi
else
    echo "[release] 3/4  Model already present ($(du -h $MODEL_FILE | cut -f1)). Skipping training."
fi

# 4. Seed the RAG knowledge base if the vector store is empty.
echo "[release] 4/4  Seeding RAG knowledge base..."
python manage.py ingest_seed \
    || echo "[release] ingest_seed failed (advisor will say 'KB empty')"

echo "[release] === Done. Starting gunicorn... ==="
