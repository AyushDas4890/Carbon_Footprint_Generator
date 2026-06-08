# C4Future — System Architecture

A Django-based carbon-footprint estimator with an ML predictor, a RAG-powered
sustainability advisor, and an agentic Bill-of-Materials decomposer.

---

## High-level view

```
                         ┌────────────────────────────────────────┐
                         │             Django (DRF) Web          │
                         │  views/templates · CSRF · sessions     │
                         └───┬────────┬─────────────┬─────────────┘
                             │        │             │
              POST /api/predict│   POST /api/compare│   POST /api/advisor/chat
                             │        │             │
                             ▼        ▼             ▼
                    ┌────────────────────────┐  ┌────────────────────────┐
                    │ predictor/services.py  │  │   advisor/services/    │
                    │   (XGBoost + SHAP)     │  │   rag_chain → retrieve │
                    │ + sustainability rating│  │           → llm        │
                    └──────────┬─────────────┘  └─────┬──────────────────┘
                               │                      │
                  ┌────────────┴──────────────┐       │
                  ▼                           ▼       ▼
       ┌──────────────────┐         ┌──────────────────┐
       │ carbon_xgb       │         │ ChromaDB (local) │
       │ joblib artifacts │         │  + SentTfm embed │
       └──────────────────┘         └────────┬─────────┘
                                             ▲
                                             │ ingest_seed / ingest_docs
                                    ┌────────┴─────────┐
                                    │  IngestionPipeline│
                                    │  PDF/.md/.txt    │
                                    └──────────────────┘
```

---

## Components

### 1. Predictor (`predictor/`)
- **Model:** XGBoost with quantile regression for real confidence intervals
  (5th/95th percentile → 90% empirical interval). Falls back to the legacy
  RandomForest if the XGBoost artifact isn't present.
- **Features (7):** material, weight, transport mode, distance, manufacturing
  intensity, country (grid carbon intensity), end-of-life treatment.
- **Explainability:** SHAP TreeExplainer for per-prediction feature
  attributions (`predictor/explanations.py`).
- **Validation:** Pydantic schemas (`predictor/schemas.py`) — catches bad
  input before the model sees it.
- **Endpoints:** `/api/predict/`, `/api/compare/`, `/api/materials/`,
  `/api/model-info/`.

### 2. RAG Advisor (`advisor/`)
- **Ingestion** (`services/ingestion.py`): LangChain
  `RecursiveCharacterTextSplitter` + `sentence-transformers/all-MiniLM-L6-v2`
  → ChromaDB. Idempotent via deterministic chunk IDs.
- **Retrieval** (`services/retrieval.py`): cosine top-K with score
  conversion (distance → similarity).
- **LLM** (`services/llm.py`): OpenAI Chat Completions with strict
  grounded-answer system prompt. `OPENAI_BASE_URL` makes it work with
  Azure / Groq / Together / vLLM / Ollama.
- **Orchestrator** (`services/rag_chain.py`): single entry point for views.
- **BoM Decomposer** (`services/bom_decomposer.py`): LLM-driven product
  decomposition → per-component prediction loop → aggregated breakdown.
  Forces JSON output via `response_format`.
- **Evaluation** (`evals/`): custom substring-recall harness + optional
  RAGAS runner.
- **Endpoints:** `/advisor/` (UI), `/api/advisor/chat/`,
  `/api/advisor/decompose/`.

### 3. Persistence
- **SQLite** (relational): `PredictionLog`, `IngestedDocument`,
  `ChatSession`, `ChatMessage`.
- **ChromaDB** (vector): persisted to `advisor/chroma_store/`.

### 4. Production stack
- **Dockerfile** — multi-stage build, Gunicorn + WhiteNoise.
- **docker-compose.yml** — single-command stack with persistent volumes
  for SQLite and ChromaDB; Postgres scaffolded as a future swap.
- **GitHub Actions** — CI (lint + Django checks + tests + Docker build)
  and a manual retrain workflow that can pull an external dataset.

---

## Data flow examples

### Single prediction
```
client → /api/predict/  →  PredictRequest (pydantic)
                        →  CarbonFootprintService.predict()
                        →  encode → XGB main + lower + upper
                        →  SHAP explainer
                        →  breakdown + offset + equivalency + rating
                        →  PredictionLog INSERT
                        →  JSON response
```

### RAG chat
```
client → /api/advisor/chat/  →  RAGChain.answer()
                              →  Retriever.retrieve() → ChromaDB top-K
                              →  LLMClient.generate() → OpenAI
                              →  ChatMessage INSERT (user + assistant)
                              →  JSON response with sources + latency
```

### Bill-of-Materials prediction
```
client → /api/advisor/decompose/
       → BoMDecomposer.decompose()        (LLM, JSON output)
       → BoMDecomposer._validate()        (schema check)
       → for each component:
            CarbonFootprintService.predict()
       → sum + sort + verdict
       → JSON response
```

---

## Configuration

All runtime config lives in `carbon_project/settings.py::ADVISOR_CONFIG`
and is sourced from environment variables. See `.env.example`.

| Var | Effect |
|---|---|
| `OPENAI_API_KEY` | Required for advisor + BoM |
| `OPENAI_BASE_URL` | Swap LLM provider without code changes |
| `ADVISOR_LLM_MODEL` | gpt-4o-mini default |
| `ADVISOR_EMBED_MODEL` | embedding model name |
| `ADVISOR_TOP_K` | retrieval breadth |
| `EXTERNAL_LCA_CSV` | (training only) real LCA dataset path |
| `MLFLOW_TRACKING_URI` | (training only) enable MLflow run logging |

---

## Why this design

- **Service layer separation.** Predictor and advisor each expose a
  single class. Storage, embedder, and LLM each sit behind an interface
  → swap ChromaDB for Qdrant, OpenAI for Llama, sentence-transformers
  for BGE, all without touching views.
- **Schema-validated inputs.** Pydantic at the boundary, manual validation
  removed. Errors are typed.
- **Real intervals, not magic numbers.** Quantile regression replaces the
  legacy ±8% hack.
- **Citations are part of the API.** Every advisor response carries the
  `sources` field with snippets + scores.
- **Eval is built in.** Hard to call a RAG system "complete" without an
  eval harness — we have one shipped + a RAGAS path for richer metrics.
- **Production hygiene.** Env-var secrets, Docker, CI, model card,
  whitenoise static serving, healthcheck.
