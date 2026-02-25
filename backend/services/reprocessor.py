"""
Background reprocessing: re-analyze all past NewsItems when aspirations change.
"""
import asyncio
import logging
from datetime import datetime

from sqlalchemy.orm import Session

from database import SessionLocal
from models import CareerAspiration, NewsItem, JobOpportunity, ReprocessingJob
from services.llm_analyzer import analyze_news

logger = logging.getLogger(__name__)


def _get_or_create_job(db: Session) -> ReprocessingJob:
    job = db.query(ReprocessingJob).first()
    if not job:
        job = ReprocessingJob()
        db.add(job)
        db.commit()
        db.refresh(job)
    return job


def get_status() -> dict:
    db = SessionLocal()
    try:
        job = _get_or_create_job(db)
        return {
            "is_running": bool(job.is_running),
            "total_items": job.total_items,
            "completed_items": job.completed_items,
            "error_count": job.error_count,
            "started_at": job.started_at,
            "finished_at": job.finished_at,
        }
    finally:
        db.close()


async def reprocess_all(trigger_aspiration_id: int | None = None):
    """
    Re-analyze all NewsItems against all current aspirations.
    If trigger_aspiration_id is given, only delete+regenerate opportunities
    for that specific aspiration; otherwise regenerate everything.

    Runs as a FastAPI BackgroundTask.
    """
    db = SessionLocal()
    try:
        job = _get_or_create_job(db)

        # Prevent concurrent runs
        if job.is_running:
            logger.warning("Reprocessing already in progress; skipping new trigger.")
            return

        job.is_running = 1
        job.started_at = datetime.utcnow()
        job.finished_at = None
        job.error_count = 0
        job.completed_items = 0
        db.commit()

        aspirations = db.query(CareerAspiration).all()
        news_items = db.query(NewsItem).all()
        job.total_items = len(news_items)
        db.commit()

        if not aspirations or not news_items:
            job.is_running = 0
            job.finished_at = datetime.utcnow()
            db.commit()
            return

        for item in news_items:
            try:
                # Delete stale opportunities
                if trigger_aspiration_id is not None:
                    db.query(JobOpportunity).filter_by(
                        aspiration_id=trigger_aspiration_id,
                        news_item_id=item.id,
                    ).delete()
                    target_aspirations = [a for a in aspirations if a.id == trigger_aspiration_id]
                else:
                    db.query(JobOpportunity).filter_by(news_item_id=item.id).delete()
                    target_aspirations = aspirations
                db.commit()

                opportunities = await analyze_news(
                    content=item.raw_content,
                    aspirations=target_aspirations,
                    image_b64=item.image_b64,
                    image_media_type=item.image_media_type,
                )

                for opp in opportunities:
                    aspiration_id = opp.get("aspiration_id")
                    if aspiration_id not in {a.id for a in target_aspirations}:
                        continue
                    db.add(
                        JobOpportunity(
                            aspiration_id=aspiration_id,
                            news_item_id=item.id,
                            company=opp.get("company"),
                            role_hint=opp.get("role_hint"),
                            summary=opp["summary"],
                            urgency=opp["urgency"],
                            next_steps=opp["next_steps"],
                            relevance_score=opp.get("relevance_score", 0.5),
                        )
                    )
                db.commit()

            except Exception as e:
                logger.error("Error reprocessing NewsItem %d: %s", item.id, e)
                db.rollback()
                job.error_count += 1
                db.commit()
            finally:
                job.completed_items += 1
                db.commit()

    finally:
        job = _get_or_create_job(db)
        job.is_running = 0
        job.finished_at = datetime.utcnow()
        db.commit()
        db.close()
