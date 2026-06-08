"""
Persistence for advisor chat — used for analytics, eval data, and showing
the user their history. Vector store data lives in ChromaDB, NOT here.
"""
from django.db import models


class IngestedDocument(models.Model):
    """One row per source document we've put into the vector store.

    We track this so we can (a) avoid re-ingesting the same file twice,
    (b) show the user where answers came from, and (c) build a RAG eval
    set later.
    """
    source_name = models.CharField(max_length=300, unique=True)
    source_type = models.CharField(
        max_length=20,
        choices=[
            ('PDF', 'PDF'),
            ('MARKDOWN', 'Markdown'),
            ('TEXT', 'Plain Text'),
            ('URL', 'Web URL'),
        ],
        default='TEXT',
    )
    citation = models.CharField(max_length=500, blank=True,
                                help_text="Human-readable citation, e.g. 'IPCC AR6 WGIII Ch.7'")
    num_chunks = models.IntegerField(default=0)
    ingested_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-ingested_at']

    def __str__(self):
        return f"{self.source_name} ({self.num_chunks} chunks)"


class ChatSession(models.Model):
    """A single user conversation. Anonymous in v1 (no auth yet)."""
    session_key = models.CharField(max_length=64, db_index=True)
    started_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-started_at']


class ChatMessage(models.Model):
    """One turn of conversation. We store retrieved chunk IDs for eval/debug."""
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=[('user', 'User'), ('assistant', 'Assistant')])
    content = models.TextField()
    # JSON: list of {source_name, citation, snippet, score}
    retrieved_sources = models.JSONField(default=list, blank=True)
    latency_ms = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
