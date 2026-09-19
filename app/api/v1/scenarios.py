from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models.scenario import Scenario
from app.db.models.simulation import Simulation
from app.db.models.user import User
from app.schemas.scenario import ScenarioCreate, ScenarioResponse
from app.services.scenario_service import run_scenario

router = APIRouter()

@router.post("", response_model=ScenarioResponse, status_code=201)
def create_scenario(payload: ScenarioCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not db.get(Simulation, payload.simulation_id):
        raise HTTPException(404, "Simulation not found")
    scenario = Scenario(
        simulation_id=payload.simulation_id,
        name=payload.name,
        scenario_type=payload.scenario_type,
        parameters=payload.parameters,
        created_by=user.id,
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return scenario

@router.post("/{scenario_id}/run")
def execute_scenario(scenario_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scenario = db.get(Scenario, scenario_id)
    if not scenario:
        raise HTTPException(404, "Scenario not found")
    return run_scenario(db, scenario)
