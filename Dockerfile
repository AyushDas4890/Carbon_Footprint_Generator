# ===== C4Future Production Dockerfile =====
# Multi-stage build: small final image, no build tools in prod.
# Optimised for HuggingFace Spaces (port 7860) and any platform that
# respects $PORT (Render, Railway, Fly.io, Cloud Run, etc.).

# ---- Stage 1: builder ----
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /build

# System deps needed to compile xgboost / sentence-transformers wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --upgrade pip \
    && pip install --user -r requirements.txt

# ---- Stage 2: runtime ----
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/root/.local/bin:$PATH \
    # HF Spaces caches HuggingFace models in /tmp by default (writable).
    HF_HOME=/app/.cache/huggingface \
    TRANSFORMERS_CACHE=/app/.cache/huggingface

# Runtime libs (libgomp needed by xgboost)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Bring deps over from builder
COPY --from=builder /root/.local /root/.local
COPY . .

# ---- Build-time setup ----
# 1. collectstatic so WhiteNoise serves /static/ in prod
# 2. data_adapter — builds training_data_hybrid.csv from data/* sources
# 3. train_xgboost — trains the XGBoost predictor + quantile + conformal models
#    and writes carbon_xgb.joblib (so the model isn't committed to git)
# 4. ingest_seed — BAKES the ChromaDB vector store into the image
#    Uses a throwaway SECRET_KEY just for management commands.
ENV BUILD_SK=build-time-throwaway-key
RUN DJANGO_SECRET_KEY=$BUILD_SK DJANGO_DEBUG=False \
    python manage.py collectstatic --noinput && \
    echo "[build] Generating real-data training files..." && \
    python predictor/training/data_adapter.py && \
    echo "[build] Training XGBoost predictor (~30s)..." && \
    python predictor/training/train_xgboost.py && \
    echo "[build] Ingesting RAG knowledge base..." && \
    DJANGO_SECRET_KEY=$BUILD_SK DJANGO_DEBUG=False \
    python manage.py ingest_seed || echo "[build] non-critical step failed (release.sh will retry)"

# Make release script executable
RUN chmod +x release.sh || true

# HF Spaces uses 7860, Render/Railway/Fly use their own $PORT. Default 7860
# so the image works on HF without extra config.
EXPOSE 7860
ENV PORT=7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD python -c "import urllib.request, sys, os; p=os.environ.get('PORT','7860'); sys.exit(0 if urllib.request.urlopen(f'http://localhost:{p}/health/', timeout=3).status == 200 else 1)"

# release.sh runs migrations + collectstatic + (re-)seeds KB if missing.
CMD ["sh", "-c", "bash release.sh && gunicorn carbon_project.wsgi:application --bind 0.0.0.0:${PORT} --workers 2 --threads 4 --timeout 120 --access-logfile -"]
