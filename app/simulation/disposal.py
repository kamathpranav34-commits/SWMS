def disposed_waste(collected_tpd: float, treated_tpd: float) -> float:
    return max(0, collected_tpd - treated_tpd)
