#!/usr/bin/env bash
# Release script — runs on each deploy AFTER the build, BEFORE the new
# web process starts. Used by Render (preDeployCommand), Railway (releaseCommand),
# Heroku (release: in Procfile), Fly.io (release_command in fly.toml).
set -e

echo "[release] Running database migrations..."
python manage.py migrate --noinput

echo "[release] Collecting static files..."
python manage.py collectstatic --noinput --clear

# Seed the RAG knowledge base if it's empty.
# Safe to run on every deploy — ingest_seed is idempotent (deterministic chunk IDs).
echo "[release] Seeding RAG knowledge base..."
python manage.py ingest_seed || echo "[release] ingest_seed failed (skipping — set OPENAI_API_KEY?)"

echo "[release] Done."
