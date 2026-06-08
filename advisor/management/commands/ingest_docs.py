"""
Ingest arbitrary PDF / Markdown / text files into the vector store.

Usage:
    python manage.py ingest_docs path/to/file.pdf --citation "IPCC AR6 WGIII Ch.7"
    python manage.py ingest_docs path/to/folder/    # ingests every .pdf/.md/.txt in folder
"""
from pathlib import Path
from django.core.management.base import BaseCommand

from advisor.services.ingestion import IngestionPipeline


class Command(BaseCommand):
    help = "Ingest a file or directory of files into the sustainability KB."

    def add_arguments(self, parser):
        parser.add_argument("path", type=str, help="File or directory")
        parser.add_argument("--citation", type=str, default="",
                            help="Human-readable citation for this source")

    def handle(self, *args, **options):
        target = Path(options["path"])
        citation = options["citation"]

        if not target.exists():
            self.stderr.write(self.style.ERROR(f"Not found: {target}"))
            return

        pipeline = IngestionPipeline()

        files = []
        if target.is_dir():
            for ext in ("*.pdf", "*.md", "*.txt"):
                files.extend(target.rglob(ext))
        else:
            files = [target]

        if not files:
            self.stderr.write(self.style.WARNING("No .pdf/.md/.txt files found."))
            return

        total_chunks = 0
        for f in files:
            self.stdout.write(f"Ingesting {f.name} ...")
            res = pipeline.ingest_file(str(f), citation=citation or f.name)
            total_chunks += res["num_chunks"]
            self.stdout.write(self.style.SUCCESS(f"  -> {res['num_chunks']} chunks"))

        stats = pipeline.stats()
        self.stdout.write(self.style.SUCCESS(
            f"\nDone. Added {total_chunks} chunks across {len(files)} file(s). "
            f"Vector store total: {stats['num_vectors']}"
        ))
