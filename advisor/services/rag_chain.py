"""
RAG orchestrator — the single entry point views import.
"""
from __future__ import annotations

import json
import time
from typing import Dict, Generator, List, Optional

from .retrieval import Retriever
from .llm import LLMClient, format_sources_for_ui

_HISTORY_WINDOW = 6


def _load_history(session_key: str) -> List[Dict]:
    try:
        from advisor.models import ChatSession, ChatMessage
        session = ChatSession.objects.filter(session_key=session_key).first()
        if not session:
            return []
        msgs = (
            ChatMessage.objects
            .filter(session=session)
            .order_by("-created_at")[:_HISTORY_WINDOW]
        )
        return [{"role": m.role, "content": m.content} for m in reversed(msgs)]
    except Exception:
        return []


def _sse(payload: Dict) -> str:
    return "data: " + json.dumps(payload) + "\n\n"


class RAGChain:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            instance = super().__new__(cls)
            instance.retriever = Retriever()   # if this raises, _instance stays None
            instance.llm = LLMClient()         # so the next call retries cleanly
            cls._instance = instance           # only cache after full successful init
        return cls._instance

    def _empty_kb_response(self, t0: float) -> Dict:
        return {
            "answer": (
                "I don't have any documents in my knowledge base yet. "
                "Run `python manage.py ingest_seed` to load the starter "
                "sustainability facts."
            ),
            "sources": [],
            "latency_ms": int((time.time() - t0) * 1000),
            "retrieved_count": 0,
        }

    def answer(self, question: str, session_key: Optional[str] = None) -> Dict:
        t0 = time.time()
        chunks = self.retriever.retrieve(question)
        if not chunks:
            return self._empty_kb_response(t0)
        history = _load_history(session_key) if session_key else []
        answer_text = self.llm.generate(
            question=question, chunks=chunks, history=history or None
        )
        return {
            "answer": answer_text,
            "sources": format_sources_for_ui(chunks),
            "latency_ms": int((time.time() - t0) * 1000),
            "retrieved_count": len(chunks),
        }

    def answer_stream(
        self, question: str, session_key: Optional[str] = None
    ) -> Generator[str, None, None]:
        t0 = time.time()
        try:
            chunks = self.retriever.retrieve(question)
        except Exception as exc:
            yield _sse({"type": "error", "message": str(exc)})
            return

        if not chunks:
            yield _sse({
                "type": "token",
                "text": (
                    "I don't have any documents in my knowledge base yet. "
                    "Run `python manage.py ingest_seed` to load the starter "
                    "sustainability facts."
                ),
            })
            yield _sse({"type": "done"})
            return

        history = _load_history(session_key) if session_key else []
        full_answer_parts: List[str] = []

        try:
            for token in self.llm.generate_stream(
                question=question, chunks=chunks, history=history or None
            ):
                full_answer_parts.append(token)
                yield _sse({"type": "token", "text": token})
        except Exception as exc:
            yield _sse({"type": "error", "message": str(exc)})
            return

        sources = format_sources_for_ui(chunks)
        yield _sse({
            "type": "sources",
            "sources": sources,
            "retrieved_count": len(chunks),
            "latency_ms": int((time.time() - t0) * 1000),
            "full_answer": "".join(full_answer_parts),
        })
        yield _sse({"type": "done"})
