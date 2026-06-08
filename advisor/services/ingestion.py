"""
Ingestion pipeline — converts raw documents into vector store entries.

Beginner notes:
  - "Ingestion" = load a document, split it into chunks, embed each chunk
    into a vector, and store them. This is the offline / one-time step.
  - We use LangChain text splitters + sentence-transformers + ChromaDB.
  - Why chunk? LLMs have context limits AND retrieval works better on
    small focused passages than on whole books.
"""
from __future__ import annotations

import os
import hashlib
from pathlib import Path
from typing import List, Dict, Optional

from django.conf import settings
# Heavy deps loaded lazily so Django management commands don't require them


class IngestionPipeline:
    """Loads files, chunks them, embeds chunks, and writes to ChromaDB.

    Idempotent: re-running on the same file does not duplicate chunks
    (we use deterministic chunk IDs derived from source_name + offset).
    """

    def __init__(self):
        cfg = settings.ADVISOR_CONFIG
        self.chroma_dir = cfg['CHROMA_DIR']
        self.collection_name = cfg['COLLECTION_NAME']
        self.embed_model_name = cfg['EMBED_MODEL']
        self.chunk_size = cfg['CHUNK_SIZE']
        self.chunk_overlap = cfg['CHUNK_OVERLAP']

        Path(self.chroma_dir).mkdir(parents=True, exist_ok=True)

        # Heavy deps loaded here so the class can be imported cheaply
        import chromadb
        from chromadb.config import Settings as ChromaSettings
        from langchain_text_splitters import RecursiveCharacterTextSplitter

        # --- Chunker ---
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

        # --- Embedder (loaded on first use) ---
        self._embedder = None

        # --- Vector store ---
        self.client = chromadb.PersistentClient(
            path=self.chroma_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        # Explicit embedding_function so Chroma doesn't eagerly load its
        # default ONNX-based one (which would require onnxruntime).
        try:
            from chromadb.utils import embedding_functions as ef
            chroma_ef = ef.DefaultEmbeddingFunction()
        except Exception:
            chroma_ef = None
        coll_kwargs = dict(name=self.collection_name, metadata={"hnsw:space": "cosine"})
        if chroma_ef is not None:
            coll_kwargs["embedding_function"] = chroma_ef
        try:
            self.collection = self.client.get_or_create_collection(**coll_kwargs)
        except Exception:
            coll_kwargs.pop("embedding_function", None)
            self.collection = self.client.get_or_create_collection(**coll_kwargs)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def ingest_file(self, path: str, citation: str = "") -> Dict:
        """Ingest a single PDF / .md / .txt file.

        Returns dict with stats. Idempotent.
        """
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"No such file: {path}")

        ext = p.suffix.lower()
        if ext == ".pdf":
            text = self._load_pdf(str(p))
            src_type = "PDF"
        elif ext in (".md", ".markdown"):
            text = self._load_markdown(str(p))
            src_type = "MARKDOWN"
        else:
            text = p.read_text(encoding="utf-8", errors="ignore")
            src_type = "TEXT"

        return self.ingest_text(
            text=text,
            source_name=p.name,
            citation=citation or p.name,
            source_type=src_type,
        )

    def ingest_text(self, text: str, source_name: str,
                    citation: str = "", source_type: str = "TEXT") -> Dict:
        """Chunk + embed + store arbitrary text. Idempotent per source_name."""
        chunks = self._chunk_text(text, source_name=source_name)
        if not chunks:
            return {"source_name": source_name, "num_chunks": 0}

        ids = [c["id"] for c in chunks]
        documents = [c["text"] for c in chunks]
        metadatas = [
            {
                "source_name": source_name,
                "citation": citation,
                "source_type": source_type,
                "chunk_index": c["chunk_index"],
            }
            for c in chunks
        ]
        embeddings = self._embed_texts(documents)

        # upsert = insert-or-overwrite by id, so re-ingesting same file is safe
        self.collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
            embeddings=embeddings,
        )

        # Record in Django DB for the admin / UI listing
        from advisor.models import IngestedDocument
        IngestedDocument.objects.update_or_create(
            source_name=source_name,
            defaults={
                "source_type": source_type,
                "citation": citation,
                "num_chunks": len(chunks),
            },
        )

        return {
            "source_name": source_name,
            "num_chunks": len(chunks),
            "chunk_ids": ids[:3],  # preview only
        }

    def stats(self) -> Dict:
        """Quick health-check — how many vectors are in the store?"""
        return {
            "collection": self.collection_name,
            "chroma_dir": self.chroma_dir,
            "num_vectors": self.collection.count(),
            "embed_model": self.embed_model_name,
        }

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _embedder_lazy(self):
        """Load the embedding model on first use (avoids slow import time)."""
        if self._embedder is None:
            from langchain_huggingface import HuggingFaceEmbeddings
            self._embedder = HuggingFaceEmbeddings(
                model_name=self.embed_model_name,
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True},
            )
        return self._embedder

    def _embed_texts(self, texts: List[str]) -> List[List[float]]:
        return self._embedder_lazy().embed_documents(texts)

    def _chunk_text(self, text: str, source_name: str) -> List[Dict]:
        """Split text, attach deterministic IDs so re-ingest is idempotent."""
        raw_chunks = self.splitter.split_text(text)
        out = []
        for i, ch in enumerate(raw_chunks):
            # Deterministic ID: hash(source + index + first 32 chars)
            # Means the same chunk always gets the same ID → upsert overwrites.
            uid_seed = f"{source_name}::{i}::{ch[:32]}"
            uid = hashlib.sha256(uid_seed.encode()).hexdigest()[:24]
            out.append({"id": uid, "text": ch, "chunk_index": i})
        return out

    @staticmethod
    def _load_pdf(path: str) -> str:
        from langchain_community.document_loaders import PyPDFLoader
        loader = PyPDFLoader(path)
        pages = loader.load()
        return "\n\n".join(p.page_content for p in pages)

    @staticmethod
    def _load_markdown(path: str) -> str:
        # Fall back to plain read if Unstructured deps are missing
        try:
            from langchain_community.document_loaders import UnstructuredMarkdownLoader
            loader = UnstructuredMarkdownLoader(path)
            docs = loader.load()
            return "\n\n".join(d.page_content for d in docs)
        except Exception:
            return Path(path).read_text(encoding="utf-8", errors="ignore")
