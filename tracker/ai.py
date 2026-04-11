import base64
import json
import os
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Optional


@dataclass
class ReceiptExtraction:
    category: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[Decimal] = None
    carbon_amount: Optional[Decimal] = None


def _get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        from openai import OpenAI  # type: ignore

        return OpenAI(api_key=api_key)
    except Exception:
        return None


def _get_openai_model() -> str:
    return os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def _safe_decimal(value: Any) -> Optional[Decimal]:
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except Exception:
        return None


def estimate_carbon_heuristic(description: str, category_name: Optional[str] = None) -> Optional[Decimal]:
    """
    Basic heuristic scorer (no API key required).
    Returns kg CO2e estimate.
    """
    d = (description or "").lower()
    cat = (category_name or "").lower()

    # Transport
    if "mile" in d or "km" in d or "drive" in d or "car" in d or cat == "transport":
        # Try to extract a simple number
        import re

        m = re.search(r"(\d+(\.\d+)?)\s*(miles|mile|km|kilometers|kilometres)", d)
        if m:
            dist = Decimal(m.group(1))
            unit = m.group(3)
            if "km" in unit:
                miles = dist * Decimal("0.621371")
            else:
                miles = dist
            # ~0.4 kg per mile gasoline
            return (miles * Decimal("0.4")).quantize(Decimal("0.01"))
        # Default small trip
        return Decimal("5.00")

    # Food
    if any(k in d for k in ["beef", "burger", "steak"]) or cat == "food":
        if any(k in d for k in ["beef", "steak", "burger"]):
            return Decimal("3.50")
        if "chicken" in d:
            return Decimal("1.00")
        if "coffee" in d:
            return Decimal("0.20")
        return Decimal("1.50")

    # Energy
    if any(k in d for k in ["kwh", "electric", "electricity", "gas", "heating"]) or cat == "energy":
        import re

        m = re.search(r"(\d+(\.\d+)?)\s*kwh", d)
        if m:
            kwh = Decimal(m.group(1))
            # ~0.5 kg per kWh
            return (kwh * Decimal("0.5")).quantize(Decimal("0.01"))
        return Decimal("10.00")

    return None


def estimate_carbon_ai(description: str, category_name: Optional[str] = None) -> Optional[Decimal]:
    """
    Uses OpenAI if configured; falls back to heuristic.
    """
    client = _get_openai_client()
    if not client:
        return estimate_carbon_heuristic(description, category_name)

    model = _get_openai_model()
    prompt = (
        "Estimate the carbon footprint (kg CO2e) for this user activity. "
        "Return ONLY JSON: {\"carbon_amount\": number}. "
        "Be conservative and reasonable.\n\n"
        f"Category: {category_name or ''}\n"
        f"Description: {description}\n"
    )
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        text = resp.choices[0].message.content or ""
        data = json.loads(text)
        return _safe_decimal(data.get("carbon_amount"))
    except Exception:
        return estimate_carbon_heuristic(description, category_name)


def extract_receipt_ai(image_bytes: bytes) -> ReceiptExtraction:
    """
    Uses OpenAI vision if configured; otherwise returns empty extraction.
    Expected JSON schema:
    {
      "category": "Food|Transport|Energy",
      "description": "...",
      "cost": number|null,
      "carbon_amount": number|null
    }
    """
    client = _get_openai_client()
    if not client:
        return ReceiptExtraction()

    model = _get_openai_model()
    b64 = base64.b64encode(image_bytes).decode("ascii")

    system = (
        "You extract structured purchase/activity info from receipts/images for a carbon tracker. "
        "Return ONLY JSON with keys: category, description, cost, carbon_amount. "
        "If unknown, use null."
    )
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract the receipt into JSON."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                    ],
                },
            ],
            temperature=0.1,
        )
        text = resp.choices[0].message.content or ""
        data = json.loads(text)
        return ReceiptExtraction(
            category=(data.get("category") or None),
            description=(data.get("description") or None),
            cost=_safe_decimal(data.get("cost")),
            carbon_amount=_safe_decimal(data.get("carbon_amount")),
        )
    except Exception:
        return ReceiptExtraction()


def eco_chat_reply(user_message: str, last_activities: list[dict[str, Any]]) -> str:
    """
    Uses OpenAI if configured; otherwise returns a simple rule-based tip.
    """
    client = _get_openai_client()
    if not client:
        # Simple fallback
        if any("transport" in (a.get("category") or "").lower() for a in last_activities):
            return "Tip: Your recent activities include transport. If possible, try public transit, carpooling, or combining trips tomorrow."
        return "Tip: Try reducing high-impact items (like beef) and aim for fewer car trips this week."

    model = _get_openai_model()
    context = json.dumps(last_activities, ensure_ascii=False)
    prompt = (
        "You are an eco-coach. Give short, specific advice. "
        "Use the user's last 5 activities (JSON) to personalize.\n\n"
        f"Last activities JSON:\n{context}\n\n"
        f"User message: {user_message}\n"
    )
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
        )
        return (resp.choices[0].message.content or "").strip() or "I couldn't generate advice right now."
    except Exception:
        return "I couldn't generate advice right now. Please try again."

