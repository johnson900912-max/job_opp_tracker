"""
Fetch and extract text content from URLs, raw text, or images.
"""
import base64
from typing import Tuple, Optional

import httpx
from bs4 import BeautifulSoup


USER_AGENT = "Mozilla/5.0 (compatible; JobOpportunityTracker/1.0)"


async def fetch_url(url: str, max_chars: int = 8000) -> str:
    """
    Fetch a URL and return extracted plain text.
    Strips nav/footer/script/style elements to focus on article content.
    Raises httpx.HTTPError on network failures.
    Raises ValueError if content cannot be extracted.
    """
    headers = {"User-Agent": USER_AGENT}
    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()

    content_type = response.headers.get("content-type", "")
    if "text/html" not in content_type and "application/xhtml" not in content_type:
        # For non-HTML (e.g. plain text pages), return raw text
        return response.text[:max_chars]

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove noise
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
        tag.decompose()

    # Prefer semantic content containers
    main = (
        soup.find("article")
        or soup.find("main")
        or soup.find(id="content")
        or soup.find(class_="content")
        or soup.body
    )
    text = main.get_text(separator="\n", strip=True) if main else soup.get_text(separator="\n", strip=True)

    # Collapse excessive blank lines
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    text = "\n".join(lines)

    return text[:max_chars]


def process_text(content: str, max_chars: int = 8000) -> str:
    """Pass-through for raw text submissions, with length cap."""
    return content[:max_chars]


def process_image(file_bytes: bytes) -> Tuple[str, str]:
    """
    Accept raw image bytes.
    Returns (base64_encoded_string, media_type).
    Detects media type from magic bytes.
    """
    media_type = _detect_image_media_type(file_bytes)
    b64 = base64.b64encode(file_bytes).decode("utf-8")
    return b64, media_type


def _detect_image_media_type(data: bytes) -> str:
    """Detect image MIME type from magic bytes."""
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    # Default to jpeg
    return "image/jpeg"
