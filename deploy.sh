#!/usr/bin/env bash
# One-command deploy to HuggingFace Spaces.
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh <your-hf-username>
#
# What it does:
#   1. Adds the HF Space as a git remote (if not already)
#   2. Pushes your current branch to the Space
#   3. HF auto-builds the Docker image and deploys
#
# Prerequisites:
#   - You've created the Space at huggingface.co/new-space (Docker SDK, free hardware)
#   - You have a write-scoped HF token from huggingface.co/settings/tokens
#   - You've set the secrets in your Space's Settings → Variables and secrets:
#       OPENAI_API_KEY, DJANGO_SECRET_KEY, DJANGO_DEBUG=False, DJANGO_ALLOWED_HOSTS

set -e

USERNAME="${1:-}"
if [ -z "$USERNAME" ]; then
  echo "Usage: ./deploy.sh <your-hf-username>"
  exit 1
fi

SPACE_NAME="${SPACE_NAME:-c4future}"
REMOTE_URL="https://huggingface.co/spaces/${USERNAME}/${SPACE_NAME}"

# Add HF remote if not present
if ! git remote get-url hf >/dev/null 2>&1; then
  echo "[deploy] Adding HF remote: $REMOTE_URL"
  git remote add hf "$REMOTE_URL"
else
  echo "[deploy] HF remote already configured: $(git remote get-url hf)"
fi

# Make sure everything's committed
if ! git diff-index --quiet HEAD --; then
  echo "[deploy] Uncommitted changes detected. Commit or stash first."
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "[deploy] Pushing branch '$CURRENT_BRANCH' to HF Space '$USERNAME/$SPACE_NAME'..."
echo "[deploy] You'll be prompted for credentials:"
echo "[deploy]   Username: your HF username"
echo "[deploy]   Password: paste a write-scoped HF access token"
echo "[deploy]            (from https://huggingface.co/settings/tokens)"

git push hf "$CURRENT_BRANCH":main

echo ""
echo "[deploy] ✓ Push complete!"
echo "[deploy] Watch the build at: ${REMOTE_URL}"
echo "[deploy] Your live URL will be: https://${USERNAME}-${SPACE_NAME}.hf.space"
echo "[deploy] First build takes 5-10 min (downloads PyTorch + sentence-transformers)."
