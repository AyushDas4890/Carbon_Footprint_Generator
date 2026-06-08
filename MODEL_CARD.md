# C4Future Model Card

This is a transparency document for the ML and RAG systems shipped with
C4Future. It follows the spirit of Mitchell et al. (2019) "Model Cards
for Model Reporting".

---

## 1. Carbon Footprint Predictor

**Version:** `xgb-v3-realdata-conformal` — supersedes the legacy `random-forest-v1`.

### Measured performance

These are the actual metrics from the training run on `2026-06-07`:

| Eval set | n | R² | MAE | 90 % coverage (raw → conformal) |
|---|---|---|---|---|
| Synthetic test (in-distribution) | 2 822 | 0.81 | 11.0 | 77 % → 89 % |
| Real held-out Agribalyse products | 524 | **0.31** | 13.3 | 80 % → **90 %** |

#### Ranking metrics on real held-out products (much more important than R² for this application)

| Metric | Value | Meaning |
|---|---|---|
| **Pearson correlation** | **0.83** | Strong linear relationship between predicted and true CO2 |
| **Spearman rank correlation** | **0.82** | Model ranks products in the right order |
| **Pairwise ranking accuracy** | **82.6 %** | Given two random products, the model correctly picks the lower-CO2 one 83 % of the time |

The 0.31 R² captures absolute-magnitude error; for a sustainability *recommender*
(where users compare options) the ranking metrics are what matter. Real LCA data
has 3× variability for the same material, putting a hard ceiling on absolute R².
The conformal interval communicates this magnitude uncertainty honestly.

#### Per-material Spearman correlation (real held-out)

| Material | n | Spearman ρ |
|---|---|---|
| Cheese | 68 | 0.90 |
| Pork | 68 | 0.88 |
| Chicken | 26 | 0.87 |
| Lamb | 16 | 0.86 |
| Potatoes | 18 | 0.90 |
| Wheat | 52 | 0.80 |
| Fish (wild) | 38 | 0.79 |
| Milk | 66 | 0.77 |
| Beans | 16 | 0.64 |
| Beef | 42 | 0.57 |

Every material achieves ρ > 0.5; most exceed 0.7.

The honest **0.31 R² on real held-out products** reflects generalization
to unseen products in a stratified product-level split (262 unique
Agribalyse products held out across 25 materials, with verified zero
product overlap between train and eval). The synthetic R² is higher
because the model partially fits its own data-generating formula.

Conformal prediction widens raw quantile intervals by `q̂ = 0.79` to
achieve the nominal 90 % empirical coverage on the held-out set.

### Intended use
- Estimate cradle-to-gate (excluding use phase) CO2-equivalent emissions
  for a single-material product or a single component of a larger product.
- Intended audience: consumers, students, sustainability analysts as an
  educational decision-support tool.
- **NOT intended for:** regulatory reporting, formal LCA studies, or
  compliance under any standard (ISO 14040 / 14067, GHG Protocol). Those
  require a certified LCA practitioner with peer-reviewed databases.

### Model architecture
- Three XGBoost regressors trained jointly:
  - `model_main` — squared-error objective (point prediction)
  - `model_lower` — quantile loss at α=0.05
  - `model_upper` — quantile loss at α=0.95
- **Conformal prediction layer** (Romano et al. 2019, "Conformalized Quantile Regression"):
  fits an offset `q̂` on a held-out calibration set to widen raw quantile
  intervals until they achieve nominal coverage. At inference we return
  `[lower − q̂, upper + q̂]`.
- Combined output: median prediction + 90 % conformal interval +
  per-prediction SHAP attributions.

### Features (7)
| Feature | Type | Source |
|---|---|---|
| material | Categorical (35 classes) | user input |
| weight_kg | Numeric | user input |
| transport_mode | Categorical (AIR/SEA/ROAD/RAIL) | user input |
| transport_distance_km | Numeric | user input |
| manufacturing_intensity | Categorical (LOW/MED/HIGH) | user input |
| country | Categorical (10 grids) | user input |
| eol | Categorical (RECYCLED/INCINERATED/LANDFILL) | user input |

### Training data
- **Hybrid dataset** (`predictor/training/training_data_hybrid.csv`):
  14 106 rows = 12 000 synthetic-calibrated + 2 106 real Agribalyse
  products. Real factors override hardcoded ones across 30 / 35 materials.
- **Calibration sources:**
  - **ADEME Agribalyse 3.1** — 2 456 French food LCAs (peer-reviewed).
  - **Poore & Nemecek 2018** — 37 food categories (Science, supplementary data).
  - **UK DEFRA 2024 Conversion Factors** — material / transport / EOL factors.
- **Splits:** 60 / 20 / 20 train / calibration / test, plus a separate
  **product-level held-out eval set** (262 unique Agribalyse products
  never seen during training, stratified across 25 materials, **0 product
  overlap with training** verified at adapter time).
- **LIMITATION:** Ecoinvent / GaBi databases are paid-license and not
  used here. Industrial materials (Aluminium, Cotton textiles, etc.) are
  not in Agribalyse's coverage so they fall back to DEFRA values.

### Evaluation
See `predictor/ml_models/metrics_xgb.json` after training. Reported per group:
- `train_synthetic_test` — synthetic-distribution test set
- `real_eval` — held-out real-product test set
- Each group includes R², RMSE, MAE, raw coverage, conformal coverage.

Re-run the smoke test any time:
```bash
python scripts/smoke_test.py
```

### Known limitations & biases
- Per-country grid is coarse (10 countries). Sub-national variation ignored.
- Sea-transport assumed container shipping. Air/road/rail are weighted
  averages — actual logistics are far more granular.
- Single-material products only. Multi-material requires the Phase 3
  BoM decomposer (and the LLM there introduces its own error).
- Manufacturing intensity is a 3-level proxy for what is in reality a
  process-by-process emission factor.

### Explainability
- Per-prediction explanations via SHAP TreeExplainer (`predictor/explanations.py`).
- Falls back to global feature importances if SHAP is not installed.

### Ethical considerations
- Predictions are educational. Treating them as authoritative could
  mislead purchasing decisions or regulatory filings.
- We do not collect personally identifying information about users.
- Sustainability claims based on this model should always be checked
  against a certified LCA before being published or marketed.

---

## 2. Sustainability Advisor (RAG)

**Version:** Phase 1, OpenAI-backed.

### Intended use
- Answer natural-language questions about LCA, emission factors, offset
  strategies, and product carbon footprints — grounded in a curated
  knowledge base. Always shows citations.

### Architecture
- **Embedder:** `sentence-transformers/all-MiniLM-L6-v2` (384-dim).
- **Vector store:** ChromaDB (persistent local).
- **Retriever:** cosine top-K (default K=4).
- **Generator:** OpenAI `gpt-4o-mini` (configurable; OpenAI-compatible
  endpoints supported via `OPENAI_BASE_URL`).
- **Grounding:** strict system prompt forbids extrapolation; refusal is
  required when context is insufficient.

### Knowledge base (default)
- File: `advisor/knowledge_base/seed_facts.md`
- ~25 short curated facts citing Poore & Nemecek 2018, IPCC AR6, DEFRA
  2023, Ember 2023, SBTi 2023, and others.
- **The system can only answer what's in the KB.** Production deployments
  should ingest the actual source PDFs via `manage.py ingest_docs`.

### Evaluation
- Custom eval set in `advisor/evals/eval_set.py` (8 cases including one
  out-of-scope refusal test).
- Run with `python manage.py eval_advisor`.
- Optional RAGAS evaluation (faithfulness, answer relevancy, context
  precision, context recall) via `advisor/evals/run_ragas.py`.

### Known limitations & risks
- **Hallucinations.** The system prompt and grounding reduce but do not
  eliminate LLM hallucinations. Always cross-check critical numbers
  against the cited source.
- **Citation accuracy.** Citations point to the source document, not the
  exact page. For PDFs, page numbers are preserved internally but not
  yet surfaced in the UI.
- **Latency.** Each query runs an embedding + a vector search + an LLM
  call (~1-3 s typical with gpt-4o-mini).
- **Cost.** OpenAI charges per token. The current top-K=4 prompt is
  ~1k input tokens; expect ~$0.0002 per question on gpt-4o-mini.

### Ethical considerations
- Generated responses are not professional advice.
- Persisted chat logs (`ChatMessage`) are kept for evaluation and
  improvement. Production deployments should add a data-retention policy
  and user consent.
