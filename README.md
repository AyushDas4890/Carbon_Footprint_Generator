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

# C4Future — Carbon Footprint AI Platform

A Django web application that combines three AI systems for sustainability:

1. **XGBoost predictor** trained on real LCA data — quantile regression
   intervals, conformal calibration, and SHAP explanations.
2. **RAG-powered sustainability advisor** — LangChain + ChromaDB +
   cross-encoder reranking + OpenAI, grounded in cited LCA / IPCC sources.
3. **Agentic Bill-of-Materials decomposer** — LLM converts natural-language
   product descriptions into per-component CO₂ estimates.

> See **[ARCHITECTURE.md](ARCHITECTURE.md)** for the system diagram,
> **[MODEL_CARD.md](MODEL_CARD.md)** for transparency on the ML/RAG systems,
> **[RAG_ADVISOR.md](RAG_ADVISOR.md)** for the RAG deep-dive,
> and **[CV_HIGHLIGHTS.md](CV_HIGHLIGHTS.md)** for portfolio talking points.

---

## Headline metrics (measured on real held-out Agribalyse products)

| Metric | Value |
|---|---|
| Real-world R² (held-out, unseen products) | **0.31** |
| Real-world MAE | 13.3 kg CO₂e |
| 90 % interval coverage (raw quantile) | 79.6 % |
| 90 % interval coverage (after conformal) | **89.7 %** |
| Synthetic-test R² (in-distribution) | 0.81 |
| Material factors with real-data provenance | 30 / 35 (DEFRA / Poore / Agribalyse) |
| Unique products held out | 262 across 25 materials |
| Train/eval product overlap | **0** (verified) |

The honest 0.31 real-world R² reflects generalization to *unseen products*
in a stratified product-level holdout. Synthetic R² is higher because the
model partially fits its own data-generating formula.

## Features

- AI Predictions with **per-prediction SHAP explanations** ("airfreight added 14 kg, the cheese material added 22 kg")
- **Conformal-prediction confidence intervals** (provable 90 % coverage)
- **Compare-products UI** — head-to-head rankings with verdict
- **AI Product Decomposer** — describe a product in English, get a component-level CO₂ breakdown
- **RAG Sustainability Advisor** — answers cite their sources
- **Cross-encoder reranking** for higher RAG precision
- Detailed breakdowns + real-world equivalencies (car-km, smartphone charges)
- Offset strategies (trees, RECs, vegan-day equivalents)
- A→E sustainability grade
- RAG eval harness (substring recall + RAGAS-ready)
- Model Card documenting limitations and intended use

## Tech Stack

- **Backend:** Django 5 · DRF · Pydantic · WhiteNoise · Gunicorn
- **ML:** XGBoost · SHAP · scikit-learn · pandas · numpy · joblib · MLflow (optional)
- **RAG:** LangChain · ChromaDB · sentence-transformers · cross-encoder
  (ms-marco-MiniLM) · OpenAI (or any OpenAI-compatible endpoint)
- **Frontend:** Vanilla JS · HTML5 · CSS3 (glassmorphism) · Chart.js
- **Storage:** SQLite + ChromaDB (vector)
- **Prod:** Docker · docker-compose · GitHub Actions

## Setup (the 7-command path)

```bash
make install                 # pip deps
cp .env.example .env         # paste OPENAI_API_KEY
make migrate                 # create DB
python predictor/training/data_adapter.py    # ingest real LCA data
make train                   # train XGBoost + conformal
make ingest                  # seed RAG knowledge base (~80 MB embedder)
make run                     # http://localhost:8000/
```

Then visit:
- `/` — calculator (SHAP explanations + A-E grade in the results)
- `/compare/` — head-to-head product ranking
- `/decompose/` — natural-language AI decomposer
- `/advisor/` — RAG chat
- `/insights/` — model insights

Run the end-to-end check any time:
```bash
python scripts/smoke_test.py
```

## API

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/predict/` | single product → CO₂ + SHAP + conformal interval |
| POST | `/api/compare/` | 2–10 products → ranked + verdict |
| GET  | `/api/materials/` | list supported materials |
| GET  | `/api/model-info/` | metrics + family |
| POST | `/api/advisor/chat/` | RAG chat (cited) |
| POST | `/api/advisor/decompose/` | natural language → BoM → per-component CO₂ |

## Evaluation

```bash
make eval                                    # custom RAG eval (recall + violation rate)
python -m advisor.evals.run_ragas            # optional RAGAS (faithfulness / answer relevancy)
python scripts/smoke_test.py                 # full pipeline check
```

## Docker

```bash
make docker-build
make docker-up
```

## Project structure

```
.
├── carbon_project/      Django config
├── core/                Pages + PredictionLog model
├── predictor/           XGBoost service + SHAP + calibration + training
│   ├── services.py
│   ├── calibration.py   Conformal prediction
│   ├── explanations.py  SHAP wrapper
│   ├── schemas.py       Pydantic
│   └── training/        train_xgboost.py · data_adapter.py · real_factors.json
├── advisor/             RAG + BoM decomposer
│   ├── services/        ingestion / retrieval / reranker / llm / rag_chain / bom_decomposer
│   ├── management/commands/ ingest_seed · ingest_docs · eval_advisor
│   ├── evals/           gold eval set + RAGAS runner
│   └── knowledge_base/  seed_facts.md + your PDFs
├── data/                Real LCA sources (Agribalyse · Poore · DEFRA)
├── scripts/smoke_test.py
├── static/              CSS / JS / videos
├── Dockerfile · docker-compose.yml · .github/workflows/
├── ARCHITECTURE.md · MODEL_CARD.md · RAG_ADVISOR.md · CV_HIGHLIGHTS.md
└── Makefile · pyproject.toml
```

---

© 2026 C4Future — Building a Sustainable Tomorrow
