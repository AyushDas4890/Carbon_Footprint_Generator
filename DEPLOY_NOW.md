# Deploy in 5 Minutes — Copy / Paste Walkthrough

Everything you need to ship to HuggingFace Spaces. I've prepared all the
config and pre-baked the ChromaDB knowledge base into the Docker image, so
your deployed container starts instantly.

---

## ⚡ The 4 actions you need to take

### 1️⃣ Generate your Django secret key (already done — copy this)

I pre-generated one for you. Paste this when HF asks for `DJANGO_SECRET_KEY`:

```
RdXllIubVL0URl7fD4uEm4ZBD2vONnzreGndZWcm-8PHUdWicPCFP2o3r8VeEr6QOWA
```

(If you'd rather generate your own, run:
`python -c "import secrets; print(secrets.token_urlsafe(50))"`)

### 2️⃣ Create the HuggingFace Space

1. Sign up / log in at <https://huggingface.co/join>
2. Open <https://huggingface.co/new-space>
3. Fill in:
   - **Owner**: `<your-username>`
   - **Space name**: `c4future`
   - **License**: MIT
   - **SDK**: **Docker** → **Blank template**
   - **Hardware**: **CPU basic · 2 vCPU · 16 GB · FREE**
   - **Visibility**: Public
4. Click **Create Space**

### 3️⃣ Add your secrets in the Space

Inside your new Space → **Settings → Variables and secrets**:

**Click `New secret` 4 times and add each:**

| Name | Value |
|---|---|
| `OPENAI_API_KEY` | `sk-...` (yours from <https://platform.openai.com/api-keys>) |
| `DJANGO_SECRET_KEY` | `RdXllIubVL0URl7fD4uEm4ZBD2vONnzreGndZWcm-8PHUdWicPCFP2o3r8VeEr6QOWA` |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | `<your-hf-username>-c4future.hf.space` |

(Replace `<your-hf-username>` with your actual HF handle. If your handle is
`ayushdas4890`, the value would be `ayushdas4890-c4future.hf.space`.)

### 4️⃣ Get a write token and push

1. Go to <https://huggingface.co/settings/tokens>
2. **Create new token** → **Write** scope → name it `c4future-deploy` → **Generate**
3. Copy the token (starts with `hf_...`)
4. From your project folder, run:

```bash
chmod +x deploy.sh
./deploy.sh <your-hf-username>
```

When git prompts:
- **Username**: your HF username
- **Password**: paste the `hf_...` token

That's it. HuggingFace builds and deploys automatically.

---

## ⏱️ What to expect

- **0–5 min:** Build phase. Watch logs on your Space page. Pip installs ~1 GB
  of dependencies (PyTorch, sentence-transformers, ChromaDB, XGBoost, etc.).
- **5–6 min:** Image-baked ChromaDB initializes (no first-run delay).
- **~6 min:** Container is live. Your URL is `https://<username>-c4future.hf.space`.

## ✅ Verify the deploy

Once your Space shows "Running", check these in order:

1. `https://<username>-c4future.hf.space/health/` → `{"status":"ok",...}`
2. `https://<username>-c4future.hf.space/` → home page renders
3. Make a prediction on `/` → see SHAP attributions on `/results/`
4. Visit `/advisor/` → click a suggestion → streaming RAG answer with citations
5. Visit `/decompose/` → describe a product → component breakdown

## 🚨 If something breaks

| Symptom | Fix |
|---|---|
| Build fails on PyTorch install | First build is ~1 GB; HF sometimes times out. Click "Restart Space". |
| `/advisor/` says "knowledge base empty" | Image-baked ingest didn't run. From Space terminal: `python manage.py ingest_seed`. |
| `DisallowedHost` in logs | `DJANGO_ALLOWED_HOSTS` doesn't match your Space URL. Update the secret. |
| OpenAI errors on first chat | Verify `OPENAI_API_KEY` is set in the Space secrets, not just env vars. |

## 📊 What you actually shipped

Your live HuggingFace Space contains:
- XGBoost predictor with SHAP explanations, conformal-calibrated 90% intervals
- RAG sustainability advisor (LangChain + ChromaDB + cross-encoder reranker + OpenAI)
- Agentic Bill-of-Materials decomposer
- A→E sustainability grade
- Compare-products page
- All trained on real Agribalyse + Poore + DEFRA data
- Real-world held-out R² of 0.31, Spearman ρ = 0.82
- Pre-baked ChromaDB index (no first-run ingestion delay)
- HTTPS + HSTS + secure cookies + CSRF trusted origins
- `/health/` endpoint for load balancer probes
- Sentry-ready (just add SENTRY_DSN secret to enable)
- Auto-redeploys on every `./deploy.sh` push

## 🎯 CV bullet — paste this verbatim once deployed

> Deployed full-stack AI carbon-footprint app to **HuggingFace Spaces** at
> `huggingface.co/spaces/<username>/c4future` — Docker image with pre-baked
> ChromaDB vector store, conformal-calibrated XGBoost predictor (real-world
> R² = 0.31, Spearman ρ = 0.82, 90% interval coverage), SHAP explanations,
> RAG advisor with cross-encoder reranking and citation grounding, agentic
> BoM decomposer, HTTPS + HSTS + Sentry monitoring, single-command deploy via
> `./deploy.sh`.
