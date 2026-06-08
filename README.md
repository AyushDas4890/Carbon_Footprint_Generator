---
title: C4Future
emoji: 🌍
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: true
license: mit
short_description: AI Carbon Footprint Predictor + RAG Sustainability Advisor
---

<div align="center">

# 🌍 C4Future — AI Carbon Footprint Platform

### Predict, explain, and reduce the carbon footprint of any product — powered by a SHAP-explainable XGBoost model and a RAG-grounded sustainability advisor.

<br>

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-c4future.hf.space-64ffb4?style=for-the-badge&logoColor=white)](https://ad074890-c4future.hf.space)
[![HuggingFace Space](https://img.shields.io/badge/🤗_HuggingFace-AD074890/c4future-yellow?style=for-the-badge)](https://huggingface.co/spaces/AD074890/c4future)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.11-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0-092E20?style=for-the-badge&logo=django)](https://www.djangoproject.com/)

<br>

### 🔗 **[Try it live → https://ad074890-c4future.hf.space](https://ad074890-c4future.hf.space)**

</div>

---

## 🎯 What it does

C4Future combines **three production AI systems** into one Django web app:

| Feature | Tech | What it does |
|---|---|---|
| 🤖 **Carbon Predictor** | XGBoost + SHAP + Conformal Prediction | Predicts product CO₂ footprint with calibrated 90 % confidence intervals and per-feature explanations |
| 💬 **RAG Advisor** | LangChain + ChromaDB + Cross-Encoder + OpenAI | Answers sustainability questions grounded in indexed LCA / IPCC sources, with inline citations |
| 🔧 **Agentic BoM Decomposer** | LLM → JSON → ML loop | Turns natural-language product descriptions (e.g. *"iPhone 15 Pro shipped from China by air"*) into a per-component CO₂ breakdown |

---

## 📊 Measured Performance

Trained on **real Agribalyse 3.1 + Poore & Nemecek 2018 + DEFRA 2024** data with a stratified product-level holdout.

| Metric | Value | What it means |
|---|---|---|
| **Real-world R²** | **0.29** | Honest fit on 524 unseen products across 25 materials |
| **Pearson correlation** | **0.83** | Strong linear relationship |
| **Spearman rank ρ** | **0.82** | Model gets product ranking right 82 % of the time |
| **Pairwise accuracy** | **82.6 %** | Correctly picks the lower-CO₂ option in pairwise comparisons |
| **Conformal coverage** | **89.7 %** | 90 % nominal interval achieves true 89.7 % empirical coverage |
| **MAE** | 13.3 kg CO₂e | Mean absolute error on held-out products |

> Synthetic R² would be ≈ 0.99 (training and testing on the same formula). The 0.29 R² is an **honest measure of real-world generalization**, not a vanity metric.

---

## ✨ Key Features

- ✅ **A→E Sustainability Grade** for every product
- ✅ **SHAP explanations** — see exactly which features pushed the prediction up or down
- ✅ **Conformalised quantile regression** (Romano et al. 2019) — provable 90 % interval coverage
- ✅ **Cross-encoder reranking** on RAG retrieval for higher citation quality
- ✅ **Streaming chat responses** with SSE
- ✅ **Out-of-scope refusal test** in the RAG eval set — model honestly says "I don't have that"
- ✅ **Compare 2-10 products** side-by-side with verdict
- ✅ **Real-world equivalencies** — kg CO₂e converted to car-km, smartphone charges, washing loads
- ✅ **Tree / REC offset recommendations**
- ✅ **Health check endpoint** at `/health/`
- ✅ **Self-healing container** — trains its own ML model on first start if missing

---

## 🛠 Tech Stack

**Backend:** Django 5 · Django REST Framework · Pydantic · WhiteNoise · Gunicorn  
**ML:** XGBoost · SHAP · scikit-learn · pandas · NumPy · joblib  
**RAG:** LangChain · ChromaDB · sentence-transformers · cross-encoder (ms-marco-MiniLM) · OpenAI GPT-4o-mini  
**Frontend:** Vanilla JS · HTML5 · CSS3 (Glassmorphism) · Chart.js · GSAP  
**Storage:** SQLite (relational) + ChromaDB (vector)  
**Production:** Docker · GitHub Actions CI · HuggingFace Spaces · Sentry-ready

---

## 🏗 Architecture

```
                                  ┌─────────────────────────────────────┐
                                  │      Django (DRF) — Web Layer       │
                                  │   views / templates / CSRF / auth   │
                                  └──┬──────────┬──────────────┬────────┘
                                     │          │              │
                       POST /api/predict   POST /api/compare   POST /api/advisor/chat/stream
                                     │          │              │
                                     ▼          ▼              ▼
                            ┌──────────────────────┐  ┌──────────────────────┐
                            │ Predictor Service    │  │  RAG Chain           │
                            │  XGB + Quantile +    │  │   Retriever → LLM    │
                            │  Conformal + SHAP    │  │   ChromaDB cosine    │
                            └──────────┬───────────┘  └─────────┬────────────┘
                                       │                        │
                                       ▼                        ▼
                              ┌───────────────────┐    ┌────────────────────┐
                              │ carbon_xgb.joblib │    │ ChromaDB (persist) │
                              │ 3 models +        │    │ + SentTfm embedder │
                              │ conformal offset  │    │ + cross-encoder    │
                              └───────────────────┘    │   reranker         │
                                                       └─────────┬──────────┘
                                                                 │
                                                       ┌─────────▼──────────┐
                                                       │ Ingestion Pipeline │
                                                       │ LangChain splitter │
                                                       └─────────┬──────────┘
                                                                 │
                                                       PDFs / .md / .txt
```

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for the full diagram + data-flow details.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone
git clone https://github.com/AyushDas4890/Carbon_Footprint_Generator.git
cd Carbon_Footprint_Generator

# 2. Install
pip install -r requirements.txt

# 3. Configure (paste your OPENAI_API_KEY)
cp .env.example .env

# 4. Build training data + train model
python predictor/training/data_adapter.py
python predictor/training/train_xgboost.py

# 5. Seed RAG knowledge base
python manage.py migrate
python manage.py ingest_seed

# 6. Run
python manage.py runserver
```

Then open `http://localhost:8000/`.

---

## 🐳 Docker (one command)

```bash
docker compose up -d
```

The Dockerfile auto-trains the model and seeds ChromaDB during build, so the container starts ready.

---

## 🚢 Deployment

This app is deployed live on **HuggingFace Spaces** at <https://ad074890-c4future.hf.space>. See **[FREE_DEPLOY.md](FREE_DEPLOY.md)** for the full free-deploy guide covering HF Spaces, Fly.io, and Render.

Production hardening already shipped:
- HTTPS + HSTS + `SECURE_PROXY_SSL_HEADER`
- CSRF trusted origins
- Secure cookies (`SECURE`, `HttpOnly`, `SameSite`)
- Health check at `/health/`
- Sentry-ready (just set `SENTRY_DSN`)
- Postgres-ready (just set `DATABASE_URL`)
- Auto-generated `DJANGO_SECRET_KEY` if not provided

---

## 📁 Project Structure

```
.
├── carbon_project/           Django config (settings, urls, wsgi)
├── core/                     Web pages + PredictionLog model
├── predictor/                XGBoost service + SHAP + calibration
│   ├── services.py
│   ├── calibration.py        Conformal prediction
│   ├── explanations.py       SHAP wrapper
│   ├── schemas.py            Pydantic
│   └── training/             train_xgboost.py · data_adapter.py
├── advisor/                  RAG + BoM decomposer
│   ├── services/
│   │   ├── ingestion.py
│   │   ├── retrieval.py
│   │   ├── reranker.py
│   │   ├── llm.py
│   │   ├── rag_chain.py
│   │   └── bom_decomposer.py
│   ├── management/commands/  ingest_seed · ingest_docs · eval_advisor
│   ├── evals/                gold eval set + RAGAS runner
│   └── knowledge_base/       seed_facts.md
├── data/                     Real LCA sources (Agribalyse, Poore CSVs)
├── scripts/smoke_test.py     End-to-end pipeline test
├── static/                   CSS / JS / videos
├── Dockerfile                Multi-stage build, trains model at build time
├── docker-compose.yml
├── render.yaml · fly.toml · Procfile · runtime.txt
├── .github/workflows/        CI + retrain
├── ARCHITECTURE.md
├── MODEL_CARD.md             Transparency doc (intended use, limitations)
├── DEPLOYMENT.md             Render / Railway / Fly walkthrough
├── FREE_DEPLOY.md            HF Spaces + Fly free-tier walkthrough
└── CV_HIGHLIGHTS.md          Portfolio talking points
```

---

## 🧪 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/predict/` | Single-product prediction → CO₂ + SHAP + conformal interval |
| `POST` | `/api/compare/` | Rank 2-10 products → ranked + verdict |
| `GET` | `/api/materials/` | List supported materials |
| `GET` | `/api/model-info/` | Model metrics + family |
| `POST` | `/api/advisor/chat/` | RAG chat (non-streaming, JSON) |
| `POST` | `/api/advisor/chat/stream/` | RAG chat with SSE streaming |
| `POST` | `/api/advisor/decompose/` | Natural language → BoM → per-component CO₂ |
| `GET` | `/health/` | Liveness check |

---

## 🎓 What I Learned Building This

- **Distribution shift is the real problem in ML.** Synthetic R² of 0.99 ≠ real-world R² of 0.29. Honest evaluation requires a stratified product-level holdout with zero leakage.
- **Conformal prediction beats vanilla quantile regression** for calibrated intervals. My raw quantile coverage was 80 %; conformal calibration pushed it to 90 % exactly.
- **Ranking metrics matter more than R² for recommenders.** My Spearman ρ of 0.82 means the model picks the right answer 82 % of the time even when absolute kg estimates are off.
- **Strict grounding prompts beat clever prompting.** My RAG advisor refuses out-of-scope questions because the system prompt is explicit, not creative.
- **Pre-bake everything you can into the Docker image.** ChromaDB seeding at build time eliminated 30-second cold starts on HF Spaces.
- **Test the unhappy paths.** My RAG eval set includes a deliberate out-of-scope question; the system passes when it refuses.

---

## 📖 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — system diagram + data flow
- **[MODEL_CARD.md](MODEL_CARD.md)** — transparency doc following Mitchell et al. 2019
- **[RAG_ADVISOR.md](RAG_ADVISOR.md)** — RAG pipeline deep-dive
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — production deploy on Render / Railway / Fly
- **[FREE_DEPLOY.md](FREE_DEPLOY.md)** — free deploy on HuggingFace Spaces
- **[CV_HIGHLIGHTS.md](CV_HIGHLIGHTS.md)** — portfolio talking points

---

## 👨‍💻 Author

**Ayush Das** — Machine Learning & RAG Engineer  
📍 Thāne, Maharashtra, India  
🔗 [LinkedIn](https://linkedin.com) · [GitHub](https://github.com/AyushDas4890)

---

## 📜 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

### 🌱 Built for a sustainable tomorrow

**[Try it live →](https://ad074890-c4future.hf.space)**

</div>
