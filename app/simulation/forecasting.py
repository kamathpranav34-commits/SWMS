def forecast_population(initial_population: float, growth_rate: float, years: int) -> list[float]:
    return [initial_population * ((1 + growth_rate) ** i) for i in range(years)]
