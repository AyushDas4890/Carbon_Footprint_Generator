# CV Highlights — C4Future

Use these bullets in your CV / portfolio. Tailor wording to the role.

---

## One-line description (top of CV)

> **C4Future — AI Carbon Footprint Platform.** Django app combining a
> SHAP-explainable **XGBoost predictor with conformal-calibrated 90 %
> intervals** trained on real Agribalyse / Poore / DEFRA data, a
> **cross-encoder-reranked RAG advisor** (LangChain · ChromaDB · OpenAI),
> and an **agentic Bill-of-Materials decomposer** that turns natural
> language into per-component CO₂ estimates. Honest 0.31 R² on a
> product-level held-out test set with zero leakage verified.

---

## Detailed bullets (project section)

- Built an end-to-end **RAG pipeline** (LangChain · ChromaDB ·
  sentence-transformers · OpenAI) with idempotent ingestion, strict
  grounded-answer prompting, and inline citation rendering — every
  answer is traceable to its source.

- Implemented a **custom RAG evaluation harness** (substring-recall +
  hallucination-violation rate) and a RAGAS-based runner measuring
  faithfulness, answer relevancy, and context precision.

- Designed an **agentic Bill-of-Materials decomposer**: an LLM converts
  natural-language product descriptions ("iPhone 15 Pro shipped from
  China by air") into structured component JSON, which is validated and
  then run through the ML predictor component-by-component.

- Upgraded the ML predictor from RandomForest to **XGBoost with quantile
  regression + conformalized prediction** (Romano et al. 2019). Raw
  quantile coverage was 80 %; conformal calibration with `q̂ = 0.79`
  fitted on a held-out calibration set delivers **90 % empirical coverage
  on real held-out products**. Added country-level grid intensity +
  end-of-life features and integrated **SHAP TreeExplainer** for
  per-prediction feature attribution surfaced in the UI.

- Built a real-data ingestion pipeline (`predictor/training/data_adapter.py`)
  that calibrates material / transport / end-of-life factors from
  **Agribalyse 3.1, Poore & Nemecek 2018, and UK DEFRA 2024**, then
  generates a hybrid training set + a product-level stratified held-out
  eval set with verified zero product overlap (262 unique products
  across 25 materials).

- Reported honest application-appropriate metrics on the real held-out set:
  **Spearman rank correlation 0.82, pairwise ranking accuracy 82.6 %,
  Pearson correlation 0.83**, with R² = 0.31 reflecting irreducible
  absolute-magnitude variance in real LCA data (~3× per material). For a
  sustainability *recommender* the ranking metrics are what matter, and
  the conformal interval communicates magnitude uncertainty honestly.

- Added a **cross-encoder reranker** (`ms-marco-MiniLM-L-6-v2`) as a
  second-stage retrieval on top of the dense MiniLM retriever. Lazy-loaded
  with graceful fallback when unavailable.

- Shipped a full **production stack**: multi-stage Dockerfile,
  docker-compose with persistent volumes, GitHub Actions CI (lint +
  tests + Docker build) and a manual retrain workflow, Pydantic schema
  validation at the API boundary, WhiteNoise static serving, Gunicorn.

- Authored a **Model Card** documenting intended use, training data,
  metrics, limitations, and ethical considerations for both the ML and
  RAG systems.

---

## Talking points (use in interviews)

**"How did you handle hallucinations?"**
> Strict system prompt + low temperature (0.2) + retrieval-first
> architecture so the model only sees curated facts. The advisor refuses
> when context is insufficient. I measure this in eval — one of my test
> cases asks an out-of-scope question and the expected behavior is a
> refusal.

**"How do you know your model isn't overfitting?"**
> 80/20 train/test split with held-out test set. For the predictor I
> report R², RMSE, MAE on the test set plus 90% interval empirical
> coverage — if my quantile models were overfit, the test-set coverage
> wouldn't match the nominal 90%. For the RAG side I run RAGAS context
> precision and recall on a curated eval set.

**"What's the hardest part of building RAG?"**
> Two things. First, chunking — `RecursiveCharacterTextSplitter` with
> the right separators preserves semantic boundaries better than
> fixed-window. Second, grounding — the system prompt has to make the
> model refuse confidently when retrieval misses, and you have to test
> that refusal behavior or the model drifts back to its prior.

**"Why XGBoost over RandomForest?"**
> Stronger on tabular data and supports quantile-regression objectives
> natively — that's how I'm getting real prediction intervals instead of
> the original ±8% hardcoded hack. Also faster inference and smaller
> on-disk model.

**"How would you scale this to 1M users?"**
> Swap SQLite → Postgres, swap ChromaDB → Qdrant or pgvector, put the
> embedder behind a TGI / vLLM endpoint so it's not on the request
> thread, cache popular queries with the canonical-form question as the
> key, add an LLM gateway with rate limits per user, move the predictor
> behind FastAPI as a sidecar so it scales independently of Django.

---

## Skills demonstrated

`Python` · `Django` · `Django REST Framework` · `LangChain` · `ChromaDB`
· `sentence-transformers` · `OpenAI API` · `XGBoost` · `SHAP` ·
`Pydantic` · `Docker` · `docker-compose` · `GitHub Actions` · `RAG` ·
`Quantile Regression` · `MLOps` · `RAGAS` · `Model Cards` ·
`Prompt Engineering`
