from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models.simulation import Simulation
from app.db.models.simulation_result import SimulationResult
from app.db.models.user import User

router = APIRouter()

@router.get("/{simulation_id}/summary")
def summary(simulation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    simulation = db.get(Simulation, simulation_id)
    if not simulation:
        raise HTTPException(404, "Simulation not found")
    rows = db.query(SimulationResult).filter(SimulationResult.simulation_id == simulation_id).order_by(SimulationResult.year).all()
    if not rows:
        return {"simulation_id": simulation_id, "message": "No results"}
    return {
        "simulation_id": simulation_id,
        "years": len(rows),
        "initial_population": rows[0].population,
        "final_population": rows[-1].population,
        "initial_waste_tpd": rows[0].waste_tpd,
        "final_waste_tpd": rows[-1].waste_tpd,
        "total_estimated_cost": sum(r.estimated_cost for r in rows),
        "peak_waste_tpd": max(r.waste_tpd for r in rows),
    }
