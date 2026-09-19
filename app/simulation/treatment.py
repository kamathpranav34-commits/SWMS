def treated_waste(collected_tpd: float, efficiency: float) -> float:
    return collected_tpd * max(0, min(efficiency, 1))
