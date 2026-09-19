def apply_disruption(value: float, disruption_percent: float) -> float:
    return value * max(0, 1 - disruption_percent / 100)
