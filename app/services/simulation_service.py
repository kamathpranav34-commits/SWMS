from sqlalchemy.orm import Session
from app.db.models.habitation_parameter import HabitationParameter
from app.db.models.simulation import Simulation
from app.db.models.simulation_result import SimulationResult

def latest_parameters(db: Session, habitation_id: str):
    rows = db.query(HabitationParameter).filter(HabitationParameter.habitation_id == habitation_id).order_by(
        HabitationParameter.category, HabitationParameter.version.desc()
    ).all()
    result = {}
    for row in rows:
        result.setdefault(row.category, row.data)
    return result

def run_simulation(db: Session, simulation_id: str):
    simulation = db.get(Simulation, simulation_id)
    params = latest_parameters(db, simulation.habitation_id)

    demo = params.get("demography", {})
    population = float(demo.get("population", 1000))
    growth_rate = float(demo.get("growth_rate", 0.02))
    waste_per_person_kg_day = float(demo.get("waste_per_person_kg_day", 0.5))

    collection_rate = float(params.get("community_infrastructure", {}).get("collection_efficiency", 0.85))
    treatment_rate = float(params.get("community_infrastructure", {}).get("treatment_efficiency", 0.60))
    disposal_cost_per_ton = float(params.get("economic_conditions", {}).get("disposal_cost_per_ton", 1000))
    collection_cost_per_ton = float(params.get("economic_conditions", {}).get("collection_cost_per_ton", 700))

    db.query(SimulationResult).filter(SimulationResult.simulation_id == simulation_id).delete()
    snapshot = {"parameters": params}
    simulation.input_snapshot = snapshot

    for i in range(simulation.duration_years):
        year = simulation.start_year + i
        current_population = population * ((1 + growth_rate) ** i)
        waste_tpd = current_population * waste_per_person_kg_day / 1000
        collected = waste_tpd * max(0, min(collection_rate, 1))
        treated = collected * max(0, min(treatment_rate, 1))
        disposed = max(0, collected - treated)
        cost = (collected * collection_cost_per_ton) + (disposed * disposal_cost_per_ton)

        db.add(SimulationResult(
            simulation_id=simulation.id,
            year=year,
            population=current_population,
            waste_tpd=waste_tpd,
            collected_tpd=collected,
            treated_tpd=treated,
            disposed_tpd=disposed,
            estimated_cost=cost,
        ))

    simulation.status = "COMPLETED"
    db.commit()
    return simulation
