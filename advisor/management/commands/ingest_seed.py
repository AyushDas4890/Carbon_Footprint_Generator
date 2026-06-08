"""
Django management command — populate the vector store with seed facts.

Usage:
    python manage.py ingest_seed
"""
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand

from advisor.services.ingestion import IngestionPipeline


class Command(BaseCommand):
    help = "Ingest the curated seed sustainability knowledge base into ChromaDB."

    def handle(self, *args, **options):
        seed_path = Path(settings.BASE_DIR) / "advisor" / "knowledge_base" / "seed_facts.md"
        if not seed_path.exists():
            self.stderr.write(self.style.ERROR(f"Seed file missing: {seed_path}"))
            return

        self.stdout.write(self.style.NOTICE("Loading embedding model (one-time download ~80MB on first run)..."))
        pipeline = IngestionPipeline()

        self.stdout.write(self.style.NOTICE(f"Ingesting {seed_path.name} ..."))
        result = pipeline.ingest_file(
            str(seed_path),
            citation="C4Future Seed Knowledge Base (curated from PN2018, IPCC AR6, DEFRA 2023, Ember, SBTi)",
        )

        stats = pipeline.stats()
        self.stdout.write(self.style.SUCCESS(
            f"OK  Ingested {result['num_chunks']} chunks. "
            f"Vector store now holds {stats['num_vectors']} total vectors."
        ))
