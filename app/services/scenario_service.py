from sqlalchemy.orm import Session
from app.db.models.simulation import Simulation
from app.db.models.simulation_result import SimulationResult
from app.db.models.scenario import Scenario

def run_scenario(db: Session, scenario: Scenario):
    base = db.query(SimulationResult).filter(
        SimulationResult.simulation_id == scenario.simulation_id
    ).order_by(SimulationResult.year).all()

    if not base:
        return {"scenario_id": scenario.id, "message": "Run the base simulation first."}

    factor = 1.0
    notes = scenario.scenario_type.upper()

    if scenario.scenario_type.upper() == "POPULATION_SURGE":
        factor = 1 + float(scenario.parameters.get("increase_percent", 20)) / 100
    elif scenario.scenario_type.upper() == "ROAD_BLOCKAGE":
        factor = 1 + float(scenario.parameters.get("collection_reduction_percent", 25)) / 100
    elif scenario.scenario_type.upper() == "FLOOD":
        factor = 1 + float(scenario.parameters.get("waste_collection_disruption_percent", 30)) / 100

    results = []
    for row in base:
        if scenario.scenario_type.upper() == "ROAD_BLOCKAGE" or scenario.scenario_type.upper() == "FLOOD":
            waste = row.waste_tpd
            collected = row.collected_tpd / factor
            treated = min(row.treated_tpd, collected)
            disposed = max(0, collected - treated)
            population = row.population
        else:
            population = row.population * factor
            waste = row.waste_tpd * factor
            collected = row.collected_tpd * factor
            treated = row.treated_tpd * factor
            disposed = row.disposed_tpd * factor

        results.append({
            "year": row.year,
            "population": population,
            "waste_tpd": waste,
            "collected_tpd": collected,
            "treated_tpd": treated,
            "disposed_tpd": disposed,
            "estimated_cost": row.estimated_cost * factor,
            "notes": notes,
        })
    return {"scenario_id": scenario.id, "scenario_type": scenario.scenario_type, "results": results}
