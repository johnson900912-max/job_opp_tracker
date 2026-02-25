import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import CareerAspiration, NewsItem, JobOpportunity
from schemas import NewsSubmitURL, NewsSubmitText, NewsSubmitResponse, NewsItemOut, JobOpportunityOut
from services.content_fetcher import fetch_url, process_text, process_image
from services.llm_analyzer import analyze_news

logger = logging.getLogger(__name__)

router = APIRouter()


async def _analyze_and_persist(
    news_item: NewsItem,
    db: Session,
) -> List[JobOpportunity]:
    """Run Claude analysis on a news item and persist JobOpportunity rows."""
    aspirations = db.query(CareerAspiration).all()
    if not aspirations:
        return []

    opportunities_data = await analyze_news(
        content=news_item.raw_content,
        aspirations=aspirations,
        image_b64=news_item.image_b64,
        image_media_type=news_item.image_media_type,
    )

    created = []
    aspiration_ids = {a.id for a in aspirations}
    for opp in opportunities_data:
        aspiration_id = opp.get("aspiration_id")
        if aspiration_id not in aspiration_ids:
            continue
        job_opp = JobOpportunity(
            aspiration_id=aspiration_id,
            news_item_id=news_item.id,
            company=opp.get("company"),
            role_hint=opp.get("role_hint"),
            summary=opp["summary"],
            urgency=opp["urgency"],
            next_steps=opp["next_steps"],
            relevance_score=opp.get("relevance_score", 0.5),
        )
        db.add(job_opp)
        created.append(job_opp)

    db.commit()
    for j in created:
        db.refresh(j)
    return created


def _enrich_opportunities(opportunities: List[JobOpportunity], news_item: NewsItem) -> List[dict]:
    result = []
    for opp in opportunities:
        d = {
            "id": opp.id,
            "aspiration_id": opp.aspiration_id,
            "news_item_id": opp.news_item_id,
            "company": opp.company,
            "role_hint": opp.role_hint,
            "summary": opp.summary,
            "urgency": opp.urgency,
            "next_steps": opp.next_steps,
            "relevance_score": opp.relevance_score,
            "created_at": opp.created_at,
            "news_source_type": news_item.source_type,
            "news_source_url": news_item.source_url,
        }
        result.append(d)
    return result


@router.post("/url", response_model=NewsSubmitResponse, status_code=201)
async def submit_url(payload: NewsSubmitURL, db: Session = Depends(get_db)):
    url = str(payload.url)
    try:
        content = await fetch_url(url, max_chars=settings.max_content_length)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Could not fetch URL: {e}. Try pasting the text directly.",
        )

    if not content.strip():
        raise HTTPException(status_code=422, detail="No text content could be extracted from the URL.")

    news_item = NewsItem(source_type="url", source_url=url, raw_content=content)
    db.add(news_item)
    db.commit()
    db.refresh(news_item)

    opportunities = await _analyze_and_persist(news_item, db)
    return NewsSubmitResponse(
        news_item=news_item,
        opportunities_created=len(opportunities),
        opportunities=_enrich_opportunities(opportunities, news_item),
    )


@router.post("/text", response_model=NewsSubmitResponse, status_code=201)
async def submit_text(payload: NewsSubmitText, db: Session = Depends(get_db)):
    content = process_text(payload.content, max_chars=settings.max_content_length)
    if not content.strip():
        raise HTTPException(status_code=422, detail="Content cannot be empty.")

    news_item = NewsItem(source_type="text", raw_content=content)
    db.add(news_item)
    db.commit()
    db.refresh(news_item)

    opportunities = await _analyze_and_persist(news_item, db)
    return NewsSubmitResponse(
        news_item=news_item,
        opportunities_created=len(opportunities),
        opportunities=_enrich_opportunities(opportunities, news_item),
    )


@router.post("/image", response_model=NewsSubmitResponse, status_code=201)
async def submit_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_bytes = await file.read()
    if len(file_bytes) > settings.max_image_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Image too large. Max size: {settings.max_image_size_bytes // 1_048_576} MB.",
        )
    if not file_bytes:
        raise HTTPException(status_code=422, detail="Uploaded file is empty.")

    b64, media_type = process_image(file_bytes)

    news_item = NewsItem(
        source_type="image",
        raw_content="[Image submission — see image data]",
        image_b64=b64,
        image_media_type=media_type,
    )
    db.add(news_item)
    db.commit()
    db.refresh(news_item)

    opportunities = await _analyze_and_persist(news_item, db)
    return NewsSubmitResponse(
        news_item=news_item,
        opportunities_created=len(opportunities),
        opportunities=_enrich_opportunities(opportunities, news_item),
    )


@router.get("/", response_model=list[NewsItemOut])
def list_news(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    return (
        db.query(NewsItem)
        .order_by(NewsItem.submitted_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.delete("/{news_id}", status_code=204)
def delete_news(news_id: int, db: Session = Depends(get_db)):
    item = db.get(NewsItem, news_id)
    if not item:
        raise HTTPException(status_code=404, detail="News item not found")
    db.delete(item)
    db.commit()
