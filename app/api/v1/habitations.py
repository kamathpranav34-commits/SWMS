from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models.habitation import Habitation
from app.db.models.user import User
from app.schemas.habitation import HabitationCreate, HabitationResponse

router = APIRouter()

@router.post("", response_model=HabitationResponse, status_code=201)
def create_habitation(payload: HabitationCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    habitation = Habitation(name=payload.name, level=payload.level, description=payload.description, created_by=user.id)
    db.add(habitation)
    db.commit()
    db.refresh(habitation)
    return habitation

@router.get("", response_model=list[HabitationResponse])
def list_habitations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Habitation).order_by(Habitation.created_at.desc()).all()

@router.get("/{habitation_id}", response_model=HabitationResponse)
def get_habitation(habitation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    habitation = db.get(Habitation, habitation_id)
    if not habitation:
        raise HTTPException(status_code=404, detail="Habitation not found")
    return habitation
