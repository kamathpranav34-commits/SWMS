def validate_demography(data: dict):
    errors = []
    if "population" in data and float(data["population"]) < 0:
        errors.append({"field": "population", "issue": "must be >= 0"})
    if "population_growth_rate" in data and float(data["population_growth_rate"]) < -1:
        errors.append({"field": "population_growth_rate", "issue": "must be >= -1"})
    if "waste_per_person_kg_day" in data and float(data["waste_per_person_kg_day"]) < 0:
        errors.append({"field": "waste_per_person_kg_day", "issue": "must be >= 0"})
    return errors
