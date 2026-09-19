from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models.habitation import Habitation
from app.db.models.habitation_parameter import HabitationParameter
from app.db.models.user import User
from app.schemas.parameters import ParameterResponse, ParameterUpdate, PARAMETER_CATEGORIES
from app.services.validation_service import validate_demography

router = APIRouter()

@router.get("/{habitation_id}/parameters", response_model=list[ParameterResponse])
def get_parameters(habitation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not db.get(Habitation, habitation_id):
        raise HTTPException(404, "Habitation not found")
    return (
        db.query(HabitationParameter)
        .filter(HabitationParameter.habitation_id == habitation_id)
        .order_by(HabitationParameter.category, HabitationParameter.version.desc())
        .all()
    )

@router.put("/{habitation_id}/parameters/{category}", response_model=ParameterResponse)
def update_parameter(
    habitation_id: str,
    category: str,
    payload: ParameterUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if category not in PARAMETER_CATEGORIES:
        raise HTTPException(400, f"Unsupported category. Use one of: {sorted(PARAMETER_CATEGORIES)}")
    if not db.get(Habitation, habitation_id):
        raise HTTPException(404, "Habitation not found")

    if category == "demography":
        errors = validate_demography(payload.data)
    if errors:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "VALIDATION_ERROR",
                "errors": errors,
            },
        )

    latest = (
        db.query(HabitationParameter)
        .filter(
            HabitationParameter.habitation_id == habitation_id,
            HabitationParameter.category == category,
        )
        .order_by(HabitationParameter.version.desc())
        .first()
    )
    current_version = latest.version if latest else 0
    if payload.expected_version is not None and payload.expected_version != current_version:
        raise HTTPException(
            status_code=409,
            detail={"code": "VERSION_CONFLICT", "current_version": current_version},
        )

    item = HabitationParameter(
        habitation_id=habitation_id,
        category=category,
        data=payload.data,
        version=current_version + 1,
        created_by=user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
