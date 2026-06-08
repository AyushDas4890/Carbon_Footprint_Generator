# C4Future — Production Deployment Guide

Everything you need to ship this to a public URL with HTTPS, persistent storage,
and proper security headers. Three platforms covered, ranked by ease.

---

## Pre-deploy checklist (do this FIRST, regardless of platform)

1. **Push the repo to GitHub** (your hosting platform will pull from there).
2. **Generate a Django secret key**:
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```
   Copy the output — you'll paste it into the hosting platform's env vars.
3. **Get your OpenAI API key** from <https://platform.openai.com/api-keys>.
4. **Verify locally**:
   ```bash
   DJANGO_DEBUG=False DJANGO_SECRET_KEY=test DJANGO_ALLOWED_HOSTS=localhost OPENAI_API_KEY=sk-... python manage.py runserver
   ```
   Confirm `/`, `/insights/`, `/compare/`, `/decompose/`, `/advisor/`, and `/health/`
   all work in this prod-mode local run.

---

## Recommended: Render.com (easiest, free tier available)

Render auto-detects Django, gives you HTTPS automatically, and you can deploy
just by clicking buttons after pushing `render.yaml` to GitHub.

### Cost
- **Free tier:** $0/mo. Web service sleeps after 15 min of idle, takes ~30s to wake up.
- **Starter:** $7/mo for 512 MB RAM, always-on. (Recommended — 512MB is tight, but
  the ML model + ChromaDB just fit if you don't load the cross-encoder.)
- **Persistent disk:** $0.25/mo per GB (1 GB is plenty for the seed knowledge base).
- **OpenAI API:** ~$0.001 per question with gpt-4o-mini, so a portfolio site
  with 100 questions/month = $0.10/mo.

### Steps

1. Sign up at <https://render.com> with your GitHub.
2. **New → Blueprint** → select your `Carbon_Footprint_Generator` repo.
   Render reads `render.yaml` and proposes the service.
3. Click **Apply**. Render will:
   - Create the web service
   - Allocate a 1 GB persistent disk for ChromaDB
   - Generate `DJANGO_SECRET_KEY` automatically
4. After the first deploy fails (it will — no `OPENAI_API_KEY` yet), go to the
   service's **Environment** tab and add:
   ```
   OPENAI_API_KEY = sk-...
   DJANGO_ALLOWED_HOSTS = c4future.onrender.com
   ```
   (Use whatever subdomain Render assigned.)
5. Click **Manual Deploy → Deploy latest commit**. Done.
6. Your site is live at `https://c4future.onrender.com` (or your custom domain
   if you point one).

### First-deploy gotchas
- The first request after a deploy is slow (~30–60s) because PyTorch +
  sentence-transformers + ChromaDB all need to load. Keep the tab open.
- Watch logs in **Logs** tab — you'll see `[predictor] XGBoost loaded.` and
  `[reranker] disabled (...)` if the cross-encoder fails to download (which is
  fine; it gracefully falls back to dense-only retrieval).

---

## Alternative: Railway (slightly nicer DX, no free tier)

Railway is similar to Render but more polished. Free $5/month credit.

### Steps
1. Sign up at <https://railway.app> with your GitHub.
2. **New Project → Deploy from GitHub repo** → select this repo.
3. Railway auto-detects the `Procfile`. Click **Deploy**.
4. Go to **Variables** and add:
   ```
   DJANGO_DEBUG = False
   DJANGO_SECRET_KEY = <your generated key>
   DJANGO_ALLOWED_HOSTS = <yourapp>.up.railway.app
   OPENAI_API_KEY = sk-...
   ADVISOR_LLM_MODEL = gpt-4o-mini
   ```
5. (Optional but recommended) **+ New → Database → Add PostgreSQL** → Railway
   automatically injects `DATABASE_URL`. Our `settings.py` picks it up.
6. **Settings → Networking → Generate Domain** → you're live.

### Cost: ~$5–10/mo for a portfolio site (mostly RAM cost).

---

## Alternative: Fly.io (best for performance, Docker-native, free tier for small apps)

Fly runs your `Dockerfile` directly on globally-distributed VMs. Best free tier
for a single small app, but requires a CLI install.

### Steps
1. Install `flyctl`: <https://fly.io/docs/hands-on/install-flyctl/>
2. `fly auth signup` and add a credit card (free tier still requires one).
3. From the project root:
   ```bash
   fly launch --no-deploy      # uses our fly.toml as template
   fly secrets set \
     OPENAI_API_KEY=sk-... \
     DJANGO_SECRET_KEY=<your-key> \
     DJANGO_ALLOWED_HOSTS=c4future.fly.dev
   fly volumes create c4future_data --size 1 --region bom
   fly deploy
   ```
4. Open in browser: `fly open`

### Cost: Free tier covers 1 small VM + 3 GB storage. Above that, ~$2–5/mo.

---

## Production environment variables — the full list

| Variable | Required? | Notes |
|---|---|---|
| `DJANGO_DEBUG` | ✓ | Must be `False` in prod |
| `DJANGO_SECRET_KEY` | ✓ | Run `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DJANGO_ALLOWED_HOSTS` | ✓ | Comma-separated hostnames, e.g. `c4future.onrender.com,c4future.com` |
| `OPENAI_API_KEY` | ✓ | From platform.openai.com |
| `ADVISOR_LLM_MODEL` | optional | Default `gpt-4o-mini`. Set `gpt-4o` for quality, `gpt-4-turbo` for compatibility. |
| `ADVISOR_EMBED_MODEL` | optional | Default `sentence-transformers/all-MiniLM-L6-v2` |
| `ADVISOR_TOP_K` | optional | Default `4` (retrieval breadth) |
| `OPENAI_BASE_URL` | optional | Point at Azure / Groq / Together / vLLM / Ollama |
| `DATABASE_URL` | optional | If set, swaps SQLite for Postgres. Render/Railway auto-set it. |
| `SENTRY_DSN` | optional | Enables error tracking. Get a free DSN at sentry.io |
| `DJANGO_SSL_REDIRECT` | optional | Default `True`. Set `False` only if your platform handles redirects. |
| `DJANGO_HSTS_SECONDS` | optional | Default `3600`. Raise to `31536000` after confidence. |

---

## Post-deploy verification

After first deploy, hit these URLs in this order:

1. **`/health/`** — should return `{"status":"ok","service":"c4future"}` instantly. Confirms the app is alive without loading any ML.
2. **`/`** — home page renders, materials dropdown is populated.
3. **`/api/model-info/`** — JSON with R², MAE, conformal coverage. Confirms the XGBoost model loaded.
4. Make a prediction on `/` → land on `/results/` with SHAP attributions.
5. **`/advisor/`** → click a suggestion chip → streaming response with citations. Confirms RAG works.
6. **`/decompose/`** → describe a product → component breakdown with non-zero CO2. Confirms the BoM agent works.

If step 5 fails with "knowledge base empty", the `release.sh` ingest_seed didn't run. Either:
- Re-run it from the platform's shell: `python manage.py ingest_seed`
- Or check that `OPENAI_API_KEY` is set in env vars (release.sh skips ingestion when it's missing).

---

## Custom domain

After your free subdomain works, add a custom domain:

### Render
1. Service → **Settings → Custom Domain** → enter `c4future.com`.
2. In your domain registrar (Namecheap, Cloudflare, etc.), add a CNAME pointing to `c4future.onrender.com`.
3. Render issues a free Let's Encrypt certificate automatically.

### Railway / Fly.io
Same idea — both have a **Domains** UI that generates the DNS records to add.

---

## Monitoring (optional but recommended)

### Free error tracking with Sentry
1. Sign up at <https://sentry.io> (free for solo projects).
2. Create a new Django project, copy the DSN.
3. Add `SENTRY_DSN=<your-dsn>` to your platform's env vars.
4. Re-deploy. Errors will now appear in the Sentry dashboard with full stack
   traces, user context, and breadcrumbs.

### Free uptime monitoring
- **UptimeRobot** (<https://uptimerobot.com>) — free, pings `/health/` every 5
  minutes. Sends email/SMS if your app goes down.
- **Better Stack** — similar, prettier UI, free tier.

---

## CV bullet points to add after you deploy

> Deployed an end-to-end AI carbon-footprint application
> (Django · XGBoost · LangChain · ChromaDB · OpenAI) to **Render.com** with
> auto-deploys from GitHub, HTTPS via Let's Encrypt, persistent disk for the
> ChromaDB vector store, conformal-calibrated prediction intervals, and Sentry
> error monitoring. CI pipeline runs `manage.py check`, smoke tests, and Docker
> build on every push.

---

## Troubleshooting

**`502 Bad Gateway` after deploy** — the app is still booting. Sentence-transformers takes ~30s to load on first request. Wait, then refresh.

**`DisallowedHost`** error in logs — `DJANGO_ALLOWED_HOSTS` doesn't include your platform's hostname. Add it as an env var.

**Advisor returns "knowledge base empty"** — `ingest_seed` didn't run. From the platform shell: `python manage.py ingest_seed`.

**`onnxruntime not installed`** — already in `requirements.txt`. If you somehow skipped it: `pip install onnxruntime==1.19.2` and redeploy.

**OpenAI charges higher than expected** — switch to `gpt-4o-mini` (default) or `gpt-3.5-turbo`. Each chat is ~1K input tokens; gpt-4o-mini costs ~$0.0002 per chat.

**Memory limit exceeded** — sentence-transformers needs ~300 MB of RAM. Bump to a 1 GB plan (~$7/mo on most platforms).

---

That's it. Push to GitHub, click through Render's blueprint flow, paste your
`OPENAI_API_KEY`, and you're live in under 10 minutes.
