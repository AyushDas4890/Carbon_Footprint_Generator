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

<br>

<img src="https://img.shields.io/badge/-🌍_C4FUTURE-0a0e27?style=for-the-badge&labelColor=0a0e27&color=64ffb4" height="60" alt="C4Future"/>

# Building a Sustainable Tomorrow — Powered by AI

### Predict · Explain · Compare · Decompose · Advise

<br>

> **A production-grade carbon-footprint platform that turns any product description into a calibrated CO₂ estimate, an explainable breakdown, and an actionable reduction plan — grounded in real LCA science.**

<br>

[![🚀 Live Demo](https://img.shields.io/badge/🚀_LIVE_DEMO-Try_it_now-64ffb4?style=for-the-badge&labelColor=0a0e27)](https://ad074890-c4future.hf.space)
[![🤗 HuggingFace](https://img.shields.io/badge/🤗_HuggingFace-AD074890/c4future-FFD21F?style=for-the-badge&labelColor=0a0e27)](https://huggingface.co/spaces/AD074890/c4future)
[![📊 Real-world R²](https://img.shields.io/badge/Real_world_R²-0.29-00d9ff?style=for-the-badge&labelColor=0a0e27)](https://ad074890-c4future.hf.space/insights/)
[![📈 Spearman ρ](https://img.shields.io/badge/Spearman_ρ-0.82-8b5cf6?style=for-the-badge&labelColor=0a0e27)](https://ad074890-c4future.hf.space/insights/)

<br>

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.0-092E20?style=flat-square&logo=django&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-2.1-006400?style=flat-square&logo=xgboost)
![LangChain](https://img.shields.io/badge/LangChain-0.2-1C3C3C?style=flat-square&logo=langchain&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-0.5-ff6b35?style=flat-square)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat-square&logo=openai&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)

<br>

### 👉 **[https://ad074890-c4future.hf.space](https://ad074890-c4future.hf.space)** 👈

<sub><i>Free hosting on HuggingFace Spaces · No sign-up needed · Click and explore</i></sub>

</div>

<br>

---

## ⚡ What this is in 30 seconds

```
   User says:                                    Model returns:
   ─────────                                     ─────────
   "Cotton t-shirt          ┌──────────────┐     ┃ 7.63 kg CO₂e
    0.5 kg, made in    ────▶│   C4Future   │────▶┃ ± 1.2 kg (90% interval)
    China, sea freight"     │  AI Platform │     ┃ Grade: B (Good)
                            └──────────────┘     ┃ Materials drove 72% of impact
                                                 ┃ Try: Recycled cotton (-31%)
```

Three production AI systems wired into one Django app, live on HuggingFace Spaces, all open-source.

<br>

## 🎯 The Three Engines

<table>
<tr>
<td width="33%" align="center" valign="top">

### 🤖 ML Predictor
**XGBoost + SHAP + Conformal**

Predicts CO₂ with provable 90% intervals.  
Trained on real Agribalyse + Poore + DEFRA data.

`Real-world R² = 0.29`  
`Spearman ρ = 0.82`  
`Coverage = 89.7%`

</td>
<td width="33%" align="center" valign="top">

### 💬 RAG Advisor
**LangChain + ChromaDB + OpenAI**

Answers grounded in LCA / IPCC sources.  
Streams responses with citations.

`Cross-encoder reranking`  
`Out-of-scope refusal eval`  
`gpt-4o-mini @ $0.0002/chat`

</td>
<td width="33%" align="center" valign="top">

### 🔧 Agentic Decomposer
**LLM → JSON → ML loop**

"iPhone 15 Pro" → component breakdown → per-component CO₂.

`JSON-mode structured output`  
`Schema-validated`  
`Multi-material products`

</td>
</tr>
</table>

<br>

---

## 📊 Live Performance Dashboard

<div align="center">

| 📈 Metric | 🎯 Value | 💡 What it means |
|:---:|:---:|:---|
| **Real-world R²** | `0.29` | Honest fit on **524 unseen products** across 25 materials |
| **Pearson correlation** | `0.83` | Strong linear agreement between predicted and true CO₂ |
| **Spearman rank ρ** | `0.82` | Model gets product **ranking** right 82% of the time |
| **Pairwise accuracy** | `82.6%` | Picks the lower-CO₂ option in head-to-head pairs |
| **Conformal coverage** | `89.7%` | Nominal 90% interval achieves **89.7% empirical coverage** |
| **MAE** | `13.3 kg CO₂e` | Mean absolute error on held-out products |
| **Pipeline latency** | `~80 ms` | Predict → SHAP → conformal interval, end-to-end |

</div>

> 🔬 **Why R² = 0.29 is the honest number.** Synthetic R² (train and test on same formula) would be 0.99 — a vanity metric. The 0.29 reflects real-world generalization on a stratified product-level holdout with **verified zero leakage**.

<br>

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 🧠 ML Engineering
- ✅ XGBoost trio: median + 2 quantile models
- ✅ **Conformalized quantile regression** (Romano 2019)
- ✅ **SHAP TreeExplainer** for per-prediction attributions
- ✅ Product-level stratified holdout, zero leakage verified
- ✅ Real data: Agribalyse 3.1, Poore & Nemecek 2018, DEFRA 2024
- ✅ Calibrated 90% intervals with empirical coverage check

</td>
<td width="50%" valign="top">

### 🤖 RAG + Agentic AI
- ✅ Dense retrieval (sentence-transformers MiniLM-L6)
- ✅ Cross-encoder reranking (ms-marco)
- ✅ ChromaDB persistent vector store
- ✅ Streaming responses via SSE
- ✅ Citation-grounded answers with snippets
- ✅ Out-of-scope refusal test in eval set
- ✅ Agentic BoM decomposer (LLM → JSON → ML)

</td>
</tr>
<tr>
<td valign="top">

### 🎨 UX Polish
- ✅ Glassmorphism design with Three.js particle bg
- ✅ GSAP scroll-linked animations
- ✅ Lenis smooth scroll
- ✅ Custom cursor + tilt cards
- ✅ A→E sustainability grade per product
- ✅ Compare 2–10 products side-by-side
- ✅ Real-world equivalencies (car-km, charges)

</td>
<td valign="top">

### 🚢 Production Hardening
- ✅ Multi-stage Dockerfile, port-7860 ready
- ✅ HTTPS + HSTS + Secure cookies + CSRF
- ✅ `/health/` endpoint for load balancers
- ✅ WhiteNoise static serving + Gunicorn
- ✅ Pydantic schemas at API boundary
- ✅ Sentry + Postgres ready (env-var driven)
- ✅ Self-healing: trains model on first start

</td>
</tr>
</table>

<br>

---

## 🛠 Tech Stack

<div align="center">

**Backend** &nbsp; ![Django](https://img.shields.io/badge/-Django_5-092E20?logo=django) ![DRF](https://img.shields.io/badge/-DRF-A30000) ![Pydantic](https://img.shields.io/badge/-Pydantic-E92063) ![Gunicorn](https://img.shields.io/badge/-Gunicorn-499848)

**ML** &nbsp; ![XGBoost](https://img.shields.io/badge/-XGBoost-006400) ![SHAP](https://img.shields.io/badge/-SHAP-FF6F00) ![scikit_learn](https://img.shields.io/badge/-scikit--learn-F7931E?logo=scikit-learn) ![pandas](https://img.shields.io/badge/-pandas-150458?logo=pandas) ![numpy](https://img.shields.io/badge/-numpy-013243?logo=numpy)

**RAG / LLM** &nbsp; ![LangChain](https://img.shields.io/badge/-LangChain-1C3C3C?logo=langchain) ![ChromaDB](https://img.shields.io/badge/-ChromaDB-ff6b35) ![SentenceTransformers](https://img.shields.io/badge/-sentence--transformers-EE4C2C) ![OpenAI](https://img.shields.io/badge/-OpenAI-412991?logo=openai)

**Frontend** &nbsp; ![JavaScript](https://img.shields.io/badge/-Vanilla_JS-F7DF1E?logo=javascript&logoColor=black) ![ChartJS](https://img.shields.io/badge/-Chart.js-FF6384?logo=chartdotjs) ![ThreeJS](https://img.shields.io/badge/-Three.js-000000?logo=threedotjs) ![GSAP](https://img.shields.io/badge/-GSAP-88CE02)

**Infra** &nbsp; ![Docker](https://img.shields.io/badge/-Docker-2496ED?logo=docker) ![HuggingFace](https://img.shields.io/badge/-🤗_Spaces-FFD21F) ![GitHub_Actions](https://img.shields.io/badge/-GitHub_Actions-2088FF?logo=github-actions) ![Sentry](https://img.shields.io/badge/-Sentry-362D59?logo=sentry)

</div>

<br>

---

## 🏗 Architecture

```
                    ┌─────────────────────────────────────────┐
                    │       Django (DRF) — Web Layer          │
                    │   Pydantic validation · CSRF · sessions │
                    └─┬───────────┬──────────────┬────────────┘
                      │           │              │
              POST /api/predict   POST /api/compare   POST /api/advisor/chat/stream
                      │           │              │
                      ▼           ▼              ▼
            ┌──────────────────┐         ┌──────────────────────┐
            │ Predictor        │         │  RAG Chain           │
            │ XGB + Quantile + │         │  Retriever → LLM     │
            │ Conformal + SHAP │         │  Cosine top-K + RR   │
            └────────┬─────────┘         └──────────┬───────────┘
                     │                              │
                     ▼                              ▼
           ┌──────────────────┐            ┌────────────────────┐
           │ carbon_xgb.joblib│            │ ChromaDB (persist) │
           │ 3 models +       │            │ + MiniLM embedder  │
           │ conformal q̂      │            │ + cross-encoder RR │
           └──────────────────┘            └─────────┬──────────┘
                                                     │
                                          ┌──────────▼──────────┐
                                          │ Ingestion Pipeline  │
                                          │ Recursive splitter  │
                                          └──────────┬──────────┘
                                                     │
                                            PDFs / .md / .txt
```

📖 Full architecture details in **[ARCHITECTURE.md](ARCHITECTURE.md)** · Transparency in **[MODEL_CARD.md](MODEL_CARD.md)**

<br>

---

## 🚀 Quick Start

<details>
<summary><b>💻 Local development (3 minutes)</b></summary>

```bash
# 1. Clone
git clone https://github.com/AyushDas4890/Carbon_Footprint_Generator.git
cd Carbon_Footprint_Generator

# 2. Install
pip install -r requirements.txt

# 3. Configure secrets
cp .env.example .env
# Edit .env and paste your OPENAI_API_KEY

# 4. Build training data + model
python predictor/training/data_adapter.py
python predictor/training/train_xgboost.py

# 5. Set up DB + seed RAG knowledge base
python manage.py migrate
python manage.py ingest_seed

# 6. Run
python manage.py runserver
```

Then open `http://localhost:8000/`.

</details>

<details>
<summary><b>🐳 Docker (one command)</b></summary>

```bash
docker compose up -d
```

The Dockerfile auto-trains the model and seeds ChromaDB during build, so the container starts ready.

</details>

<details>
<summary><b>🤗 Deploy your own copy free on HuggingFace Spaces</b></summary>

See **[FREE_DEPLOY.md](FREE_DEPLOY.md)** for a complete walkthrough.

Short version:
```bash
# 1. Create a Space at huggingface.co/new-space (Docker SDK, CPU-Basic free)
# 2. Set secrets: OPENAI_API_KEY, DJANGO_SECRET_KEY, DJANGO_ALLOWED_HOSTS
# 3. Push:
git remote add hf https://huggingface.co/spaces/<your-user>/c4future
git push hf main
```

</details>

<br>

---

## 🧪 API Reference

| Method | Endpoint | What it does |
|:---:|:---|:---|
| `POST` | `/api/predict/` | Single-product prediction → **CO₂ + SHAP + conformal interval** |
| `POST` | `/api/compare/` | Rank 2–10 products → ranked list + verdict |
| `GET` | `/api/materials/` | List supported materials |
| `GET` | `/api/model-info/` | Live model metrics + family |
| `POST` | `/api/advisor/chat/` | RAG chat — non-streaming JSON |
| `POST` | `/api/advisor/chat/stream/` | RAG chat — **SSE streaming** with citations |
| `POST` | `/api/advisor/decompose/` | Natural language → BoM → per-component CO₂ |
| `GET` | `/health/` | Liveness check (load balancer probe) |

<br>

---

## 🎓 What I Learned Building This

<table>
<tr>
<td width="50%" valign="top">

### 🧪 ML Lessons
- **Distribution shift is the real problem.** Synthetic R²=0.99 ≠ real R²=0.29. Stratified product-level holdout with zero leakage is the only honest test.
- **Conformal prediction > vanilla quantile regression** for calibrated intervals. Pushed coverage from 80% → 90% exactly.
- **Rank metrics matter for recommenders.** Spearman ρ=0.82 means the model picks the right answer 82% of the time even when absolute kg estimates are off.

</td>
<td width="50%" valign="top">

### 🤖 RAG Lessons
- **Strict grounding prompts beat clever prompting.** My advisor refuses out-of-scope questions because the system prompt is explicit.
- **Cross-encoder reranking is worth the latency.** Top-K=4 from a top-20 dense pool, reranked, is the production pattern.
- **Test the refusal path.** My eval set has a deliberate out-of-scope question; system passes when it says "I don't have that."

</td>
</tr>
</table>

<br>

---

## 📁 Project Structure

<details>
<summary><b>Click to expand</b></summary>

```
.
├── 🧠 predictor/                    XGBoost service + SHAP + calibration
│   ├── services.py
│   ├── calibration.py               Conformal prediction
│   ├── explanations.py              SHAP wrapper
│   ├── schemas.py                   Pydantic
│   └── training/
│       ├── train_xgboost.py
│       └── data_adapter.py
│
├── 🤖 advisor/                      RAG + BoM decomposer
│   ├── services/
│   │   ├── ingestion.py
│   │   ├── retrieval.py
│   │   ├── reranker.py              Cross-encoder ms-marco
│   │   ├── llm.py
│   │   ├── rag_chain.py
│   │   └── bom_decomposer.py
│   ├── management/commands/         ingest_seed · ingest_docs · eval_advisor
│   ├── evals/                       Gold eval set + RAGAS runner
│   └── knowledge_base/seed_facts.md
│
├── 🌐 core/                         Web pages + PredictionLog model
├── ⚙️  carbon_project/              Django config
├── 📊 data/                         Real LCA sources (Agribalyse, Poore)
├── 🧪 scripts/smoke_test.py         End-to-end pipeline test
├── 🎨 static/                       CSS / JS / videos
│
├── 🐳 Dockerfile                    Multi-stage, trains model at build
├── 🐳 docker-compose.yml
├── 🚢 render.yaml · fly.toml · Procfile · runtime.txt
├── 🔄 .github/workflows/            CI + retrain
│
├── 📖 ARCHITECTURE.md               System diagram + data flow
├── 📖 MODEL_CARD.md                 Transparency doc
├── 📖 DEPLOYMENT.md                 Render / Railway / Fly walkthrough
├── 📖 FREE_DEPLOY.md                HuggingFace Spaces guide
└── 📖 CV_HIGHLIGHTS.md              Portfolio talking points
```

</details>

<br>

---

## 📖 Documentation

| Doc | What's inside |
|:---|:---|
| 🏗 [ARCHITECTURE.md](ARCHITECTURE.md) | System diagram, data flow, design decisions |
| 📋 [MODEL_CARD.md](MODEL_CARD.md) | Transparency doc · intended use · limitations · ethics |
| 🤖 [RAG_ADVISOR.md](RAG_ADVISOR.md) | RAG pipeline deep dive |
| 🚢 [DEPLOYMENT.md](DEPLOYMENT.md) | Render / Railway / Fly walkthrough |
| 🤗 [FREE_DEPLOY.md](FREE_DEPLOY.md) | Free deploy on HuggingFace Spaces |
| 🎯 [CV_HIGHLIGHTS.md](CV_HIGHLIGHTS.md) | Portfolio talking points |

<br>

---

## 👨‍💻 Author

<table>
<tr>
<td width="120" align="center">
<img src="https://avatars.githubusercontent.com/AyushDas4890" width="100" style="border-radius:50%" alt="Ayush Das" />
</td>
<td>

### Ayush Das

**Machine Learning & RAG Engineer** · 📍 Thāne, Maharashtra, India

Building practical AI systems at the intersection of **classical ML, retrieval-augmented generation, and production engineering.**

[![GitHub](https://img.shields.io/badge/GitHub-AyushDas4890-181717?style=flat-square&logo=github)](https://github.com/AyushDas4890)
[![HuggingFace](https://img.shields.io/badge/🤗-AD074890-FFD21F?style=flat-square)](https://huggingface.co/AD074890)
[![Live Demo](https://img.shields.io/badge/🚀_Try_C4Future-ad074890--c4future.hf.space-64ffb4?style=flat-square)](https://ad074890-c4future.hf.space)

</td>
</tr>
</table>

<br>

---

## 📜 License

Released under the **MIT License** — see [LICENSE](LICENSE).

<br>

<div align="center">

---

### 🌱 Built for a sustainable tomorrow

<br>

[![🚀 Try it Live](https://img.shields.io/badge/🚀_Try_it_Live-ad074890--c4future.hf.space-64ffb4?style=for-the-badge&labelColor=0a0e27)](https://ad074890-c4future.hf.space)

<sub>If this project helped you, give it a ⭐ on GitHub and a ❤️ on HuggingFace</sub>

<br>

`Made with 🌿 by Ayush Das · 2026`

</div>
