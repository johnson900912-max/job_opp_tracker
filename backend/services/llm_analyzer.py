"""
Claude LLM integration for analyzing news content against career aspirations.
"""
import json
import asyncio
import logging
from typing import List, Optional

import anthropic

from config import settings

logger = logging.getLogger(__name__)

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 2048

SYSTEM_PROMPT = """You are an expert career opportunity analyst. Your task is to read a news item and identify concrete job opportunities it signals for each of the user's career aspirations.

You MUST respond ONLY with a valid JSON object — no markdown, no explanation, no code fences. Match this schema exactly:

{
  "opportunities": [
    {
      "aspiration_id": <integer>,
      "company": <string or null>,
      "role_hint": <string or null>,
      "summary": "<1-2 sentence explanation of the opportunity>",
      "urgency": "<apply_now | watch_space | informational>",
      "next_steps": "<specific, actionable recommendation>",
      "relevance_score": <float between 0.0 and 1.0>
    }
  ]
}

Urgency definitions:
- "apply_now": an active job posting exists OR a strong, immediate hiring signal is present
- "watch_space": the company/industry is growing/hiring in a relevant direction, but no open role yet
- "informational": useful industry context but no clear near-term job signal

Rules:
- Only include entries where relevance_score >= 0.3
- If no opportunities are relevant to any aspiration, return {"opportunities": []}
- Be specific: name the company, suggest the likely role title
- next_steps should be actionable (e.g. "Visit careers.openai.com and search for ML Engineer roles")
"""


def _build_aspirations_block(aspirations: list) -> str:
    lines = []
    for a in aspirations:
        desc = f" — {a.description}" if a.description else ""
        lines.append(f"  ID {a.id}: {a.title}{desc}")
    return "\n".join(lines)


def _parse_claude_json(raw: str) -> dict:
    """Strip optional code fences and parse JSON."""
    text = raw.strip()
    # Remove markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]  # remove first line
        if text.endswith("```"):
            text = text[: text.rfind("```")]
    return json.loads(text.strip())


def _sync_analyze(messages: list) -> str:
    """Synchronous Anthropic call — run in executor to avoid blocking."""
    response = _client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    return response.content[0].text


async def analyze_news(
    content: str,
    aspirations: list,
    image_b64: Optional[str] = None,
    image_media_type: Optional[str] = None,
) -> List[dict]:
    """
    Analyze news content against a list of CareerAspiration ORM objects.
    Returns a list of raw opportunity dicts matching the JSON schema.
    """
    if not aspirations:
        return []

    aspirations_block = _build_aspirations_block(aspirations)

    if image_b64 and image_media_type:
        # Vision call: image + text prompt in the same user message
        user_content = [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": image_media_type,
                    "data": image_b64,
                },
            },
            {
                "type": "text",
                "text": (
                    f"Analyze this image for job opportunities.\n\n"
                    f"CAREER ASPIRATIONS TO EVALUATE:\n{aspirations_block}"
                ),
            },
        ]
    else:
        user_content = (
            f"NEWS ITEM:\n---\n{content}\n---\n\n"
            f"CAREER ASPIRATIONS TO EVALUATE:\n{aspirations_block}"
        )

    messages = [{"role": "user", "content": user_content}]

    try:
        raw = await asyncio.to_thread(_sync_analyze, messages)
        parsed = _parse_claude_json(raw)
        opportunities = parsed.get("opportunities", [])

        # Validate and sanitize each opportunity
        valid = []
        for opp in opportunities:
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
        logger.error("Failed to parse Claude JSON response: %s", e)
        return []
    except Exception as e:
        logger.error("Claude API error: %s", e)
        raise
