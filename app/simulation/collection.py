def collectable_waste(waste_tpd: float, efficiency: float) -> float:
    return waste_tpd * max(0, min(efficiency, 1))
