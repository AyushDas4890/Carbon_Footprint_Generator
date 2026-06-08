# RAG Sustainability Advisor — Architecture & Setup

This document describes the **Phase 1** add-on to C4Future: a Retrieval-Augmented
Generation (RAG) chat agent grounded in a vector store of LCA / IPCC /
emission-factor sources.

---

## Why it exists

The base C4Future calculator answers *"How much CO2 does product X emit?"*. The
Advisor answers everything around it — *why* it emits that much, *how to
reduce it*, *what offset strategy makes sense*, and so on. Every answer is
grounded in indexed source documents and shows its citations.

## Architecture

```
                  ┌──────────────┐
   User question  │              │       Top-K chunks
  ──────────────► │   Retriever  │  ──────────────────┐
                  │              │                    │
                  └──────┬───────┘                    ▼
                         │                  ┌─────────────────┐
                         │   query vector   │   LLM (Claude)  │
                         ▼                  │  + system prompt│
                  ┌──────────────┐          │  + numbered ctx │
                  │   ChromaDB   │          └────────┬────────┘
                  │  (persistent)│                   │
                  └──────────────┘                   │  grounded answer
                         ▲                            ▼
                         │ vectors            ┌─────────────────┐
                  ┌──────┴───────┐            │  Sources + ans  │
                  │  Ingestion   │            │  back to client │
                  │  Pipeline    │            └─────────────────┘
                  └──────────────┘
                         ▲
                         │ PDFs / .md / .txt
                  ┌──────┴───────┐
                  │ knowledge_   │
                  │ base/        │
                  └──────────────┘
```

### Components

| File | Responsibility |
|---|---|
| `advisor/services/ingestion.py` | Load doc → chunk → embed → write to ChromaDB |
| `advisor/services/retrieval.py` | Embed query → top-K similarity search |
| `advisor/services/llm.py` | System prompt + OpenAI call + citation formatting |
| `advisor/services/rag_chain.py` | Orchestrates retrieve → generate, returns sources |
| `advisor/views.py` | `/advisor/` page + `POST /api/advisor/chat/` endpoint |
| `advisor/management/commands/ingest_seed.py` | Bootstrap KB with curated facts |
| `advisor/management/commands/ingest_docs.py` | Add your own PDFs / Markdown |

### Tech choices

| Concern | Pick | Why |
|---|---|---|
| Vector DB | **ChromaDB** (persistent local) | Zero ops, persists to disk, free |
| Embeddings | **sentence-transformers/all-MiniLM-L6-v2** | 384-dim, 80MB, no API key |
| LLM | **OpenAI GPT-4o-mini** | Fast, cheap, strong instruction-following. `OPENAI_BASE_URL` swaps to Azure / Groq / Together / vLLM / Ollama with no code change. |
| Orchestration | **LangChain** (splitters + loaders only) | Recognizable on CV; we keep the chain itself simple |
| Framework | **Django + DRF** | Matches existing project |

### Configurable knobs (env vars)

| Var | Default | Notes |
|---|---|---|
| `OPENAI_API_KEY` | — | Required |
| `OPENAI_BASE_URL` | (unset) | Point at Azure / Groq / Together / Ollama for free or self-hosted |
| `ADVISOR_LLM_MODEL` | `gpt-4o-mini` | Swap for `gpt-4o` for better quality, `gpt-4-turbo` for older clients |
| `ADVISOR_EMBED_MODEL` | `all-MiniLM-L6-v2` | Swap for `BAAI/bge-large-en-v1.5` (1024-dim, slower) |
| `ADVISOR_TOP_K` | `4` | More = higher recall, more tokens, more cost |

---

## Setup

```bash
# 1. Install new deps
pip install -r requirements.txt

# 2. Create env file
cp .env.example .env
# Open .env and paste your OPENAI_API_KEY

# 3. Run migrations (creates the IngestedDocument/ChatSession/ChatMessage tables)
python manage.py makemigrations advisor
python manage.py migrate

# 4. Populate the vector store with seed facts
#    (first run downloads ~80MB embedding model — be patient)
python manage.py ingest_seed

# 5. (Optional) Add your own LCA PDFs:
python manage.py ingest_docs /path/to/ipcc_ar6_wg3.pdf --citation "IPCC AR6 WGIII (2022)"

# 6. Start the server
python manage.py runserver
# Visit http://localhost:8000/advisor/
```

---

## How to evaluate the system (Phase 5 preview)

You can already build a small eval set:

```python
EVAL_QUESTIONS = [
    {"q": "Why is beef so high in CO2?", "must_contain": ["methane", "ruminant"]},
    {"q": "Which is greener: sea or air freight?", "must_contain": ["sea", "60x"]},
    # ... 20 more
]
```

For a proper eval, swap to **RAGAS** (`pip install ragas`) which measures
*faithfulness*, *answer relevancy*, and *context precision* automatically.

---

## What this demonstrates on a CV

- End-to-end RAG pipeline: **ingestion → chunking → embedding → vector store → retrieval → grounded generation → citation rendering**
- Idempotent ingestion with deterministic IDs (production pattern)
- Strict grounded-answer system prompt to minimize hallucinations
- Pluggable architecture: vector store, embedder, LLM each behind a single interface
- Persistence of conversations for analytics + future fine-tuning data
- Clear path to RAGAS / LangSmith evaluation
