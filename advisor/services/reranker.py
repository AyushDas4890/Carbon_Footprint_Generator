"""
Cross-encoder reranker — second-stage retrieval for higher precision.

Dense retrievers (our MiniLM embedder) are FAST but coarse. A cross-encoder
reads the query AND each candidate chunk together, so it makes much more
accurate relevance judgments — at the cost of latency.

The standard 2-stage pattern:
  Stage 1 (dense):  fetch top-N candidates with embeddings (N=20)
  Stage 2 (rerank): score (query, chunk) pairs with cross-encoder, take top-K (K=4)

We use `cross-encoder/ms-marco-MiniLM-L-6-v2` — small, fast, MS-MARCO-tuned,
free to download. First call downloads ~90MB.

Why this matters for CV:
  - Reranking is a hallmark of production RAG.
  - Recruiters specifically ask "how do you fix bad retrieval?" — this IS
    the answer.
"""
from __future__ import annotations
from typing import List, Dict, Optional


class CrossEncoderReranker:
    """Lazy-loaded cross-encoder. Falls back to identity if model unavailable."""

    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model_name = model_name
        self._model: Optional[object] = None
        self._available: Optional[bool] = None  # tri-state: unknown / yes / no

    def _load(self):
        if self._available is False:
            return None
        if self._model is not None:
            return self._model
        try:
            from sentence_transformers import CrossEncoder
            self._model = CrossEncoder(self.model_name, device="cpu")
            self._available = True
            return self._model
        except Exception as e:
            # First-run on a fresh box may fail (network, missing deps).
            # Don't crash retrieval — just bypass reranking.
            print(f"[reranker] disabled ({e})")
            self._available = False
            return None

    def rerank(self, query: str, chunks: List[Dict], top_k: int) -> List[Dict]:
        """Re-score and re-order chunks. Returns top_k.

        Each chunk's `score` is replaced with the cross-encoder relevance
        score. Original embedding score moved to `dense_score`.
        """
        if not chunks:
            return chunks
        model = self._load()
        if model is None:
            return chunks[:top_k]

        pairs = [(query, c["text"]) for c in chunks]
        scores = model.predict(pairs)
        for c, s in zip(chunks, scores):
            c["dense_score"] = c.get("score", 0.0)
            c["score"] = round(float(s), 4)
        chunks.sort(key=lambda c: c["score"], reverse=True)
        return chunks[:top_k]
