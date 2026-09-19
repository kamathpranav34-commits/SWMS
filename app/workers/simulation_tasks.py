from app.workers.celery_app import celery_app
from app.db.database import SessionLocal
from app.services.simulation_service import run_simulation

@celery_app.task
def run_simulation_task(simulation_id: str):
    db = SessionLocal()
    try:
        run_simulation(db, simulation_id)
        return {"simulation_id": simulation_id, "status": "COMPLETED"}
    finally:
        db.close()
