from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from database import get_db
from models import CareerAspiration
from schemas import AspirationCreate, AspirationUpdate, AspirationOut
from services.reprocessor import reprocess_all

router = APIRouter()


@router.get("/", response_model=list[AspirationOut])
def list_aspirations(db: Session = Depends(get_db)):
    return db.query(CareerAspiration).order_by(CareerAspiration.created_at).all()


@router.post("/", response_model=AspirationOut, status_code=201)
async def create_aspiration(
    payload: AspirationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    aspiration = CareerAspiration(**payload.model_dump())
    db.add(aspiration)
    db.commit()
    db.refresh(aspiration)
    # Run analysis for new aspiration against all existing news
    background_tasks.add_task(reprocess_all, aspiration.id)
    return aspiration


@router.put("/{aspiration_id}", response_model=AspirationOut)
async def update_aspiration(
    aspiration_id: int,
    payload: AspirationUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    aspiration = db.get(CareerAspiration, aspiration_id)
    if not aspiration:
        raise HTTPException(status_code=404, detail="Aspiration not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(aspiration, field, value)
    db.commit()
    db.refresh(aspiration)

    # Re-analyze all past news for this updated aspiration
    background_tasks.add_task(reprocess_all, aspiration_id)
    return aspiration


@router.delete("/{aspiration_id}", status_code=204)
def delete_aspiration(aspiration_id: int, db: Session = Depends(get_db)):
    aspiration = db.get(CareerAspiration, aspiration_id)
    if not aspiration:
        raise HTTPException(status_code=404, detail="Aspiration not found")
    db.delete(aspiration)
    db.commit()
