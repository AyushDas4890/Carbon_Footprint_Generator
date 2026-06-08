"""
Advisor views — page render + JSON chat + SSE streaming endpoint.
"""
import json
import logging
from django.http import StreamingHttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from advisor.models import IngestedDocument, ChatSession, ChatMessage

logger = logging.getLogger(__name__)


def _get_or_create_session_key(request) -> str:
    if not request.session.session_key:
        request.session.save()
    return request.session.session_key


def _persist_messages(session_key: str, question: str, answer: str,
                      sources: list, latency_ms: int) -> None:
    try:
        chat_session, _ = ChatSession.objects.get_or_create(session_key=session_key)
        ChatMessage.objects.create(session=chat_session, role="user", content=question)
        ChatMessage.objects.create(
            session=chat_session, role="assistant",
            content=answer, retrieved_sources=sources, latency_ms=latency_ms,
        )
    except Exception:
        logger.warning("Failed to persist chat history", exc_info=True)


def advisor_page(request):
    docs = IngestedDocument.objects.all()[:20]
    return render(request, 'advisor.html', {
        'ingested_docs': docs,
        'doc_count': IngestedDocument.objects.count(),
    })


class ChatView(APIView):
    """POST /api/advisor/chat/  — non-streaming, returns full JSON response."""

    def post(self, request):
        question = (request.data.get("question") or "").strip()
        if not question:
            return Response({"success": False, "error": "Missing 'question' field"},
                            status=status.HTTP_400_BAD_REQUEST)
        if len(question) > 1000:
            return Response({"success": False, "error": "Question too long (max 1000 chars)"},
                            status=status.HTTP_400_BAD_REQUEST)

        session_key = _get_or_create_session_key(request)

        try:
            from advisor.services.rag_chain import RAGChain
            result = RAGChain().answer(question, session_key=session_key)
        except RuntimeError as e:
            return Response({"success": False, "error": str(e)},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.exception("RAG chain failure")
            return Response({"success": False, "error": "Internal error: " + str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        _persist_messages(session_key, question,
                          result["answer"], result["sources"], result["latency_ms"])

        return Response({
            "success": True,
            "answer": result["answer"],
            "sources": result["sources"],
            "latency_ms": result["latency_ms"],
            "retrieved_count": result["retrieved_count"],
        })


@csrf_exempt
@require_POST
def stream_chat_view(request):
    """POST /api/advisor/chat/stream/ — SSE streaming endpoint.

    Yields events:
      data: {"type":"token",   "text":"..."}
      data: {"type":"sources", "sources":[...], "retrieved_count":N, "latency_ms":M, "full_answer":"..."}
      data: {"type":"done"}
      data: {"type":"error",   "message":"..."}
    """
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        def _e():
            yield 'data: {"type":"error","message":"Invalid JSON body"}\n\n'
        return StreamingHttpResponse(_e(), content_type="text/event-stream")

    question = (body.get("question") or "").strip()
    if not question:
        def _e():
            yield 'data: {"type":"error","message":"Missing question"}\n\n'
        return StreamingHttpResponse(_e(), content_type="text/event-stream")

    if len(question) > 1000:
        def _e():
            yield 'data: {"type":"error","message":"Question too long (max 1000 chars)"}\n\n'
        return StreamingHttpResponse(_e(), content_type="text/event-stream")

    session_key = _get_or_create_session_key(request)

    def _event_stream():
        from advisor.services.rag_chain import RAGChain
        chain = RAGChain()
        full_answer_parts = []
        final_sources = []
        final_latency = 0

        try:
            for event in chain.answer_stream(question, session_key=session_key):
                yield event
                try:
                    payload = json.loads(event[len("data: "):].strip())
                    if payload.get("type") == "token":
                        full_answer_parts.append(payload.get("text", ""))
                    elif payload.get("type") == "sources":
                        final_sources = payload.get("sources", [])
                        final_latency = payload.get("latency_ms", 0)
                except Exception:
                    pass
        except Exception as exc:
            logger.exception("Streaming RAG chain failure")
            yield "data: " + json.dumps({"type": "error", "message": str(exc)}) + "\n\n"
            return

        if full_answer_parts:
            _persist_messages(session_key, question,
                              "".join(full_answer_parts), final_sources, final_latency)

    resp = StreamingHttpResponse(_event_stream(), content_type="text/event-stream")
    resp["Cache-Control"] = "no-cache"
    resp["X-Accel-Buffering"] = "no"
    return resp


class BoMDecomposeView(APIView):
    """POST /api/advisor/decompose/ — agentic Bill-of-Materials decomposer."""

    def post(self, request):
        desc = (request.data.get("description") or "").strip()
        country = (request.data.get("country") or "CHINA").upper()
        eol = (request.data.get("eol") or "LANDFILL").upper()

        if not desc:
            return Response({"success": False, "error": "Missing 'description' field"},
                            status=status.HTTP_400_BAD_REQUEST)
        if len(desc) > 500:
            return Response({"success": False, "error": "Description too long (max 500 chars)"},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            from advisor.services.bom_decomposer import BoMDecomposer
            result = BoMDecomposer().predict_full(desc, country=country, eol=eol)
        except ValueError as e:
            return Response({"success": False, "error": "LLM output invalid: " + str(e)},
                            status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except Exception as e:
            logger.exception("BoM decompose failed")
            return Response({"success": False, "error": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(result)
