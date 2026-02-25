from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import JobOpportunity
from schemas import JobOpportunityOut, UrgencyUpdate
from routers.utils import build_opportunity_out

router = APIRouter()


@router.patch("/{opportunity_id}/urgency", response_model=JobOpportunityOut)
def update_urgency(
    opportunity_id: int,
    payload: UrgencyUpdate,
    db: Session = Depends(get_db),
):
    opp = db.get(JobOpportunity, opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    opp.urgency = payload.urgency
    db.commit()
    db.refresh(opp)
    return build_opportunity_out(opp)
