"""Retrieval service — dense top-N + optional cross-encoder rerank → top-K.

Heavy deps (chromadb, langchain) are imported lazily inside __init__ so
Django management commands like `makemigrations` don't require them.
"""
from __future__ import annotations
from typing import List, Dict, Optional
from django.conf import settings


class Retriever:
    """Embeds a query and returns top-K matching chunks with metadata + scores."""

    def __init__(self):
        cfg = settings.ADVISOR_CONFIG
        self.collection_name = cfg['COLLECTION_NAME']
        self.chroma_dir = cfg['CHROMA_DIR']
        self.embed_model_name = cfg['EMBED_MODEL']
        self.top_k = cfg['TOP_K']

        import chromadb
        from chromadb.config import Settings as ChromaSettings
        self.client = chromadb.PersistentClient(
            path=self.chroma_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        # Provide an explicit no-op embedding function so Chroma doesn't
        # try to load its default ONNX-based one (which needs onnxruntime).
        # We always pass our own `query_embeddings`, so this is never called.
        try:
            from chromadb.utils import embedding_functions as ef
            noop_ef = ef.DefaultEmbeddingFunction()  # lazy — only called if no query_embeddings
        except Exception:
            noop_ef = None
        kwargs = dict(name=self.collection_name, metadata={"hnsw:space": "cosine"})
        if noop_ef is not None:
            kwargs["embedding_function"] = noop_ef
        try:
            self.collection = self.client.get_or_create_collection(**kwargs)
        except Exception:
            # Fall back: try without embedding_function (older Chroma)
            kwargs.pop("embedding_function", None)
            self.collection = self.client.get_or_create_collection(**kwargs)
        self._embedder = None
        self._reranker = None

    def _embedder_lazy(self):
        if self._embedder is None:
            from langchain_huggingface import HuggingFaceEmbeddings
            # CRITICAL: must use the SAME model as ingestion or vectors don't compare.
            self._embedder = HuggingFaceEmbeddings(
                model_name=self.embed_model_name,
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True},
            )
        return self._embedder

    def retrieve(self, query: str, k: Optional[int] = None,
                 candidates: int = 20, rerank: bool = True) -> List[Dict]:
        """Two-stage retrieval: dense top-N → cross-encoder rerank → top-K."""
        k = k or self.top_k
        if self.collection.count() == 0:
            return []

        query_emb = self._embedder_lazy().embed_query(query)
        n_dense = max(candidates, k) if rerank else k

        results = self.collection.query(
            query_embeddings=[query_emb],
            n_results=n_dense,
            include=["documents", "metadatas", "distances"],
        )

        out = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            # Chroma returns cosine *distance* (0 = identical). Convert to similarity.
            similarity = max(0.0, 1.0 - float(dist))
            out.append({
                "text": doc,
                "source_name": meta.get("source_name", "unknown"),
                "citation": meta.get("citation", ""),
                "chunk_index": meta.get("chunk_index", -1),
                "score": round(similarity, 4),
            })

        # Stage 2: cross-encoder rerank if available
        if rerank and len(out) > k:
            if self._reranker is None:
                from advisor.services.reranker import CrossEncoderReranker
                self._reranker = CrossEncoderReranker()
            out = self._reranker.rerank(query, out, top_k=k)
        else:
            out = out[:k]

        return out
