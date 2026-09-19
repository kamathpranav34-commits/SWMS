def waste_generation_tpd(population: float, waste_per_person_kg_day: float = 0.5) -> float:
    return population * waste_per_person_kg_day / 1000
