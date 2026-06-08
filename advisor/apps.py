from django.apps import AppConfig


class AdvisorConfig(AppConfig):
    """
    RAG-powered Sustainability Advisor app.

    Provides a chat interface grounded in a vector store of LCA / IPCC /
    sustainability sources. See `advisor/services/` for the pipeline.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'advisor'
    verbose_name = 'Sustainability Advisor (RAG)'
