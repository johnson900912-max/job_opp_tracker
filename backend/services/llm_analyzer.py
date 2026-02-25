import json
import asyncio
import logging
from typing import List, Optional
from groq import Groq
from config import settings

logger = logging.getLogger(__name__)
_client = Groq(api_key=settings.groq_api_key)
TEXT_MODEL = "llama-3.3-70b-versatile"
VISION_MODEL = "llama-3.2-11b-vision-preview"
MAX_TOKENS = 2048

SYSTEM_PROMPT = """You are an expert career opportunity analyst. Read a news item and identify concrete job opportunities it signals for each career aspiration.

Respond ONLY with valid JSON — no markdown, no explanation:

{
  "opportunities": [
    {
      "aspiration_id": <integer>,
      "company": <string or null>,
      "role_hint": <string or null>,
      "summary": "<1-2 sentence explanation>",
      "urgency": "<apply_now | watch_space | informational>",
      "next_steps": "<specific actionable recommendation>",
      "relevance_score": <float 0.0-1.0>
    }
  ]
}

Urgency: "apply_now" = active hiring signal, "watch_space" = growing but no open role yet, "informational" = useful context only.
Only include entries where relevance_score >= 0.3. If nothing relevant, return {"opportunities": []}."""


def _build_aspirations_block(aspirations: list) -> str:
    return "\n".join(
        f"  ID {a.id}: {a.title}" + (f" — {a.description}" if a.description else "")
        for a in aspirations
    )


def _parse_json(raw: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text[:text.rfind("```")]
    return json.loads(text.strip())


def _sync_analyze(messages: list, model: str) -> str:
    response = _client.chat.completions.create(
        model=model,
        max_tokens=MAX_TOKENS,
        messages=messages,
    )
    return response.choices[0].message.content


async def analyze_news(
    content: str,
    aspirations: list,
    image_b64: Optional[str] = None,
    image_media_type: Optional[str] = None,
) -> List[dict]:
    if not aspirations:
        return []

    aspirations_block = _build_aspirations_block(aspirations)

    if image_b64 and image_media_type:
        user_content = [
            {"type": "image_url", "image_url": {"url": f"data:{image_media_type};base64,{image_b64}"}},
            {"type": "text", "text": f"Analyze this image for job opportunities.\n\nCAREER ASPIRATIONS:\n{aspirations_block}"},
        ]
        model = VISION_MODEL
    else:
        user_content = f"NEWS ITEM:\n---\n{content}\n---\n\nCAREER ASPIRATIONS:\n{aspirations_block}"
        model = TEXT_MODEL

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]

    try:
        raw = await asyncio.to_thread(_sync_analyze, messages, model)
        parsed = _parse_json(raw)
        valid = []
        for opp in parsed.get("opportunities", []):
            if not isinstance(opp, dict):
                continue
            if "summary" not in opp or "urgency" not in opp or "next_steps" not in opp:
                continue
            if opp.get("urgency") not in ("apply_now", "watch_space", "informational"):
                opp["urgency"] = "informational"
            opp.setdefault("relevance_score", 0.5)
            opp.setdefault("company", None)
            opp.setdefault("role_hint", None)
            valid.append(opp)
        return valid
    except json.JSONDecodeError as e:
        logger.error("Failed to parse JSON: %s", e)
        return []
    except Exception as e:
        logger.error("Groq API error: %s", e)
        raise
