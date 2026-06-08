"""Smoke tests for the RAG pipeline. Run with: python manage.py test advisor"""
from django.test import TestCase
from advisor.services.ingestion import IngestionPipeline
from advisor.services.retrieval import Retriever


class IngestionSmokeTest(TestCase):
    """Verify the chunker splits text without losing content."""

    def test_chunker_preserves_content(self):
        text = "A" * 5000
        chunks = IngestionPipeline()._chunk_text(text, source_name="test")
        joined = "".join(c['text'] for c in chunks)
        # Allow overlap to inflate length, but no content should vanish
        self.assertGreaterEqual(len(joined), len(text))


# NOTE: Retrieval + LLM tests need an embedded model + API key.
# Mark them as integration tests and run separately.
