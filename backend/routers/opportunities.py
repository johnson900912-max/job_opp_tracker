from typing import Optional, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import CareerAspiration, JobOpportunity, NewsItem
from schemas import AspirationDashboard, AspirationOut, JobOpportunityOut, DashboardOut, ReprocessingStatus
from services.reprocessor import get_status

router = APIRouter()


def _build_opportunity_out(opp: JobOpportunity) -> JobOpportunityOut:
    news = opp.news_item
    return JobOpportunityOut(
        id=opp.id,
        aspiration_id=opp.aspiration_id,
        news_item_id=opp.news_item_id,
        company=opp.company,
        role_hint=opp.role_hint,
        summary=opp.summary,
        urgency=opp.urgency,
        next_steps=opp.next_steps,
        relevance_score=opp.relevance_score,
        created_at=opp.created_at,
        news_source_type=news.source_type if news else None,
        news_source_url=news.source_url if news else None,
    )


@router.get("/", response_model=DashboardOut)
def get_dashboard(
    aspiration_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(CareerAspiration).order_by(CareerAspiration.created_at)
    if aspiration_id is not None:
        query = query.filter(CareerAspiration.id == aspiration_id)
    aspirations = query.all()

    panels = []
    for asp in aspirations:
        opps = (
            db.query(JobOpportunity)
            .filter_by(aspiration_id=asp.id)
            .order_by(JobOpportunity.relevance_score.desc(), JobOpportunity.created_at.desc())
            .all()
        )
        panels.append(
            AspirationDashboard(
                aspiration=AspirationOut.model_validate(asp),
                opportunities=[_build_opportunity_out(o) for o in opps],
            )
        )

    return DashboardOut(panels=panels)


@router.get("/reprocessing/status", response_model=ReprocessingStatus)
def reprocessing_status():
    return get_status()
