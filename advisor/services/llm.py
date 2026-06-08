"""
LLM wrapper — calls OpenAI with a strict grounded-answer system prompt.
"""
from __future__ import annotations

from typing import Generator, List, Dict, Optional
from django.conf import settings


SYSTEM_PROMPT = """You are C4Future's Sustainability Advisor. You help users
understand the carbon footprint of products, materials, food, and supply
chains. You are factual, concise, and never invent numbers.

You MUST follow these rules:
1. Answer ONLY using facts from the <context> blocks below.
2. If the context does not contain the answer, say so honestly. Do NOT guess.
3. Cite sources inline using [n] where n is the source number shown.
4. Prefer specific numbers (kg CO2e, percentages) over vague claims.
5. Keep answers under 6 sentences unless the user explicitly asks for depth.
6. If the user asks for product comparisons or recommendations, ground each
   point in a cited source.

When relevant, suggest the user try the C4Future prediction tool on the home
page for a quantitative estimate of their specific product."""


USER_TEMPLATE = """<context>
{context_block}
</context>

User question: {question}

Answer the question following the rules. Cite sources as [1], [2], etc."""


def format_context(chunks: List[Dict]) -> str:
    if not chunks:
        return "(no context retrieved)"
    parts = []
    for i, c in enumerate(chunks, start=1):
        cite = c.get("citation") or c.get("source_name", "unknown")
        parts.append(f"[{i}] Source: {cite}\n{c['text'].strip()}")
    return "\n\n---\n\n".join(parts)


def format_sources_for_ui(chunks: List[Dict]) -> List[Dict]:
    return [
        {
            "n": i,
            "source_name": c.get("source_name"),
            "citation": c.get("citation"),
            "score": c.get("score"),
            "snippet": (c.get("text", "")[:240] + "...") if len(c.get("text", "")) > 240 else c.get("text", ""),
        }
        for i, c in enumerate(chunks, start=1)
    ]


class LLMClient:
    def __init__(self):
        cfg = settings.ADVISOR_CONFIG
        self.api_key = cfg['OPENAI_API_KEY']
        self.base_url = cfg.get('OPENAI_BASE_URL')
        self.model = cfg['LLM_MODEL']
        self._client = None

    def _client_lazy(self):
        if self._client is None:
            if not self.api_key:
                raise RuntimeError(
                    "OPENAI_API_KEY not set. Copy .env.example to .env "
                    "and add your key from platform.openai.com/api-keys."
                )
            from openai import OpenAI
            kwargs = {"api_key": self.api_key}
            if self.base_url:
                kwargs["base_url"] = self.base_url
            self._client = OpenAI(**kwargs)
        return self._client

    def _build_messages(self, question: str, chunks: List[Dict],
                        history: Optional[List[Dict]] = None) -> List[Dict]:
        """Build messages: [system] -> [history last 6] -> [user with context]."""
        messages: List[Dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            messages.extend(history[-6:])
        context_block = format_context(chunks)
        user_msg = USER_TEMPLATE.format(
            context_block=context_block,
            question=question.strip(),
        )
        messages.append({"role": "user", "content": user_msg})
        return messages

    def generate(self, question: str, chunks: List[Dict],
                 history: Optional[List[Dict]] = None,
                 max_tokens: int = 600, temperature: float = 0.2) -> str:
        client = self._client_lazy()
        messages = self._build_messages(question, chunks, history)
        response = client.chat.completions.create(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=messages,
        )
        return (response.choices[0].message.content or "").strip()

    def generate_stream(self, question: str, chunks: List[Dict],
                        history: Optional[List[Dict]] = None,
                        max_tokens: int = 600,
                        temperature: float = 0.2) -> Generator[str, None, None]:
        client = self._client_lazy()
        messages = self._build_messages(question, chunks, history)
        stream = client.chat.completions.create(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=messages,
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
