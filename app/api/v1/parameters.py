from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models.habitation import Habitation
from app.db.models.habitation_parameter import HabitationParameter
from app.db.models.user import User
from app.schemas.parameters import ParameterResponse, ParameterUpdate, PARAMETER_CATEGORIES
from app.services.validation_service import validate_parameter

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

@router.put(
    "/{habitation_id}/parameters/{category}",
    response_model=ParameterResponse
)
def update_parameter(
    habitation_id: str,
    category: str,
    payload: ParameterUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Check category
    if category not in PARAMETER_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "UNSUPPORTED_CATEGORY",
                "message": (
                    f"Unsupported category. "
                    f"Use one of: {sorted(PARAMETER_CATEGORIES)}"
                ),
            },
        )

    # Check habitation
    if not db.get(Habitation, habitation_id):
        raise HTTPException(
            status_code=404,
            detail="Habitation not found",
        )

    # Validate category data
    validation_result = validate_parameter(
    category,
    payload.data,
    )

    if validation_result["status"] == "INVALID":
        raise HTTPException(
            status_code=422,
            detail={
                "code": "VALIDATION_ERROR",
                "errors": validation_result,
            },
    )

    # Find latest version
    latest = (
        db.query(HabitationParameter)
        .filter(
            HabitationParameter.habitation_id == habitation_id,
            HabitationParameter.category == category,
        )
        .order_by(
            HabitationParameter.version.desc()
        )
        .first()
    )

    current_version = (
        latest.version
        if latest
        else 0
    )

    # Optimistic locking
    if (
        payload.expected_version is not None
        and payload.expected_version != current_version
    ):
        raise HTTPException(
            status_code=409,
            detail={
                "code": "VERSION_CONFLICT",
                "current_version": current_version,
            },
        )

    # Create new version
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