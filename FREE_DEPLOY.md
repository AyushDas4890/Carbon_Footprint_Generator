# Free Docker Deployment Guide

Three completely free ways to ship C4Future to a public HTTPS URL. Ranked by
ease, with **HuggingFace Spaces recommended for your stack** (Docker + ML).

---

## Option 1 — HuggingFace Spaces 🤗 (BEST for ML projects, recommended)

### Why HF Spaces wins for this project
- **Free 16 GB RAM** + 2 vCPU on CPU-Basic tier (no credit card needed)
- **Docker-native** — uses our `Dockerfile` as-is
- **Always on** (no idle-sleep penalty like Render free tier)
- **HTTPS auto** + custom domain support
- **Built for ML demos** — looks excellent on an AI/ML CV
- **Public HF profile** — your project shows up at `huggingface.co/<your-username>`

### Step-by-step (10 minutes)

**1. Sign up** at <https://huggingface.co/join> (free, GitHub login works).

**2. Create a new Space:**
- Go to <https://huggingface.co/new-space>
- Owner: your username
- Space name: `c4future`
- License: MIT
- **Select SDK: Docker** → **Blank template**
- Hardware: **CPU basic (free)**
- Visibility: Public

Click **Create Space**.

**3. Add HuggingFace metadata to your README**

HuggingFace reads YAML frontmatter from the **first lines of `README.md`**.
Add this to the very top of your README.md (above the existing content):

```yaml
---
title: C4Future
emoji: 🌍
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: AI Carbon Footprint Predictor + RAG Sustainability Advisor
---
```

**4. Set the secret (don't commit it!)**

In your Space's **Settings → Variables and secrets → New secret**:
- `OPENAI_API_KEY` = `sk-...` (your real key)
- `DJANGO_SECRET_KEY` = (run the generator below and paste output)
- `DJANGO_DEBUG` = `False`
- `DJANGO_ALLOWED_HOSTS` = `<your-username>-c4future.hf.space`

Generate a secret key:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**5. Push your code to the Space**

HF Spaces are just Git repos. Add it as a remote:

```bash
# Inside your project folder
git remote add hf https://huggingface.co/spaces/<your-username>/c4future
git push hf main
```

When prompted for credentials, use your HF username + a **write-scoped access token** from <https://huggingface.co/settings/tokens>.

**6. Watch the build**

Open the Space URL — you'll see the build logs streaming. First build takes
5–10 minutes (downloads PyTorch, sentence-transformers model, etc.). After
that, deploys are ~1 min.

**Your app will live at:** `https://<your-username>-c4future.hf.space`

### HF Spaces gotchas

- **Port 7860 is mandatory.** Our Dockerfile uses `$PORT` already, so it
  works — HF injects `PORT=7860` automatically.
- **Static files:** WhiteNoise + the Dockerfile's `collectstatic` step
  handles this. No nginx needed.
- **Persistent storage:** HF Spaces have ephemeral filesystem by default.
  ChromaDB will rebuild on every restart (~30s). To make it permanent, upgrade
  to **HF Persistent Storage** (paid, but you can ignore for a portfolio).
- **Cold start:** ~30–60s for the first request (model loads). After that, fast.

---

## Option 2 — Fly.io (also fully free for small apps)

### What's free
- 3 shared-CPU VMs (256 MB each) — too small for our ML stack, BUT
- Single 1 GB shared-cpu VM uses ~$1.94/mo if it ran 24/7
- **`auto_stop_machines = true`** in our `fly.toml` means it stops when idle
  → typically $0–2/mo for a portfolio site that gets occasional traffic
- 3 GB persistent volume free
- 160 GB outbound bandwidth free

### Steps

```bash
# Install flyctl (Windows PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Sign up (will ask for credit card but won't charge for portfolio usage)
fly auth signup

# From your project root — uses our fly.toml as template
fly launch --no-deploy

# Set secrets
fly secrets set \
  OPENAI_API_KEY=sk-... \
  DJANGO_SECRET_KEY=$(python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())") \
  DJANGO_ALLOWED_HOSTS=c4future.fly.dev \
  DJANGO_DEBUG=False

# Create persistent volume in Mumbai region
fly volumes create c4future_data --size 1 --region bom

# Deploy
fly deploy

# Open in browser
fly open
```

Lives at `https://c4future.fly.dev`. Volume keeps ChromaDB across restarts.

---

## Option 3 — Render free tier (free but sleeps)

Free Render web services **sleep after 15 minutes of inactivity** and take
~30 seconds to wake on the next request. Fine for a portfolio link, awful
for actual users.

```bash
# 1. Push your repo to GitHub
git push origin main

# 2. Go to https://dashboard.render.com/blueprints
# 3. Click "New Blueprint" → connect your repo
# 4. Render reads render.yaml — change plan: starter to plan: free
#    in render.yaml before pushing, or edit in the dashboard
# 5. Add OPENAI_API_KEY env var
# 6. Deploy
```

Lives at `https://c4future.onrender.com`. Will sleep after 15 min idle.

---

## Comparison cheat-sheet

| Feature | HuggingFace Spaces | Fly.io | Render free |
|---|---|---|---|
| **Cost** | $0 forever | ~$0 (auto-stops) | $0 |
| **RAM** | **16 GB** 🎯 | 1 GB | 512 MB |
| **CPU** | 2 vCPU | 1 shared-cpu | 0.5 CPU |
| **Sleeps idle?** | No | Yes (auto-restarts) | Yes (15 min) |
| **Persistent disk** | Ephemeral (paid for persistent) | 3 GB free | Paid only |
| **HTTPS** | Auto | Auto | Auto |
| **Custom domain** | Free | Free | Free |
| **Build time** | 5–10 min first | 3–5 min | 5–8 min |
| **Cold start** | 30–60 s first hit | ~5 s on auto-start | 30–60 s |
| **Best for** | **ML/AI portfolios** | Production small apps | Quick demos |

**TL;DR:** Use **HuggingFace Spaces**. It's literally built for this kind of project.

---

## Universal env vars to set on any platform

```
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<run get_random_secret_key()>
DJANGO_ALLOWED_HOSTS=<your-deployed-hostname>
OPENAI_API_KEY=sk-...
ADVISOR_LLM_MODEL=gpt-4o-mini
```

Cost per chat with `gpt-4o-mini`: ~$0.0002. Your first 5,000 questions
cost you a single dollar.

---

## Post-deploy verification

After your Space/Fly app shows "running", hit these URLs in order:

1. `https://<your-url>/health/` → `{"status":"ok","service":"c4future"}`
2. `https://<your-url>/` → home page with materials dropdown populated
3. `https://<your-url>/insights/` → empty state CTA card
4. Make a prediction on `/` → see SHAP attributions on `/results/`
5. `https://<your-url>/advisor/` → click a suggestion → streaming RAG answer with citations
6. `https://<your-url>/decompose/` → "Cotton t-shirt 200g from Bangladesh by sea" → component breakdown

If `/advisor/` says "knowledge base empty", run from the platform's shell:
```bash
python manage.py ingest_seed
```

---

## Add to your CV

> Deployed end-to-end ML application to **HuggingFace Spaces** with Docker,
> free CPU-Basic hardware (16 GB RAM), HTTPS via Let's Encrypt, public URL at
> `huggingface.co/spaces/<username>/c4future`. Auto-deploys on `git push`,
> health check + structured logging + Sentry integration.

Or replace the platform name based on what you chose.

---

## Why I'm recommending HuggingFace Spaces specifically for *you*

You said you're an ML/RAG engineer building a CV. HuggingFace Spaces is the
de facto demo platform in the ML community. Recruiters at AI companies
(Anthropic, OpenAI, Cohere, Mistral, Hugging Face itself) routinely browse
HF profiles to find candidates. Hosting your project there:

1. **Signals you're plugged into the ML ecosystem** (vs random web hosts).
2. **Free 16 GB RAM** means sentence-transformers + ChromaDB + Django all run
   comfortably with no out-of-memory crashes.
3. **No idle-sleep** means your link works whenever a recruiter clicks it.
4. **Your HF profile** at `huggingface.co/<username>` becomes a second portfolio
   page that you can link from your CV.

If you only deploy once, deploy to HuggingFace Spaces.
