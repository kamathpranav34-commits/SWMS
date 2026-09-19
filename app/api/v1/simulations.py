from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models.habitation import Habitation
from app.db.models.simulation import Simulation
from app.db.models.simulation_result import SimulationResult
from app.db.models.user import User
from app.schemas.simulation import SimulationCreate, SimulationResponse
from app.services.simulation_service import run_simulation

router = APIRouter()

@router.post("", response_model=SimulationResponse, status_code=201)
def create_simulation(payload: SimulationCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    habitation = db.get(Habitation, payload.habitation_id)
    if not habitation:
        raise HTTPException(404, "Habitation not found")
    simulation = Simulation(
        habitation_id=payload.habitation_id,
        name=payload.name,
        start_year=payload.start_year,
        duration_years=payload.duration_years,
        status="RUNNING",
        created_by=user.id,
    )
    db.add(simulation)
    db.commit()
    db.refresh(simulation)
    try:
        run_simulation(db, simulation.id)
    except Exception as exc:
        simulation.status = "FAILED"
        db.commit()
        raise HTTPException(500, f"Simulation failed: {exc}")
    db.refresh(simulation)
    return simulation

@router.get("/{simulation_id}", response_model=SimulationResponse)
def get_simulation(simulation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    simulation = db.get(Simulation, simulation_id)
    if not simulation:
        raise HTTPException(404, "Simulation not found")
    return simulation

@router.get("/{simulation_id}/results")
def get_results(simulation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not db.get(Simulation, simulation_id):
        raise HTTPException(404, "Simulation not found")
    rows = db.query(SimulationResult).filter(SimulationResult.simulation_id == simulation_id).order_by(SimulationResult.year).all()
    return [
        {
            "year": r.year,
            "population": r.population,
            "waste_tpd": r.waste_tpd,
            "collected_tpd": r.collected_tpd,
            "treated_tpd": r.treated_tpd,
            "disposed_tpd": r.disposed_tpd,
            "estimated_cost": r.estimated_cost,
            "notes": r.notes,
        }
        for r in rows
    ]
