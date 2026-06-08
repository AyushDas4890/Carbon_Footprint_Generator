from django.contrib import admin
from .models import IngestedDocument, ChatSession, ChatMessage


@admin.register(IngestedDocument)
class IngestedDocumentAdmin(admin.ModelAdmin):
    list_display = ('source_name', 'source_type', 'num_chunks', 'ingested_at')
    list_filter = ('source_type',)
    search_fields = ('source_name', 'citation')


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('session_key', 'started_at')


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'role', 'created_at', 'latency_ms')
    list_filter = ('role',)
