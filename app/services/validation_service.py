from __future__ import annotations

from typing import Any


VALID = "VALID"
WARNING = "WARNING"
INVALID = "INVALID"


def _result(status: str, errors: list[str], warnings: list[str]) -> dict[str, Any]:
    return {
        "status": status,
        "errors": errors,
        "warnings": warnings,
    }


def _finalize(errors: list[str], warnings: list[str]) -> dict[str, Any]:
    if errors:
        return _result(INVALID, errors, warnings)

    if warnings:
        return _result(WARNING, errors, warnings)

    return _result(VALID, errors, warnings)


def _number(
    data: dict[str, Any],
    key: str,
    *,
    minimum: float | None = None,
    maximum: float | None = None,
    errors: list[str],
    warnings: list[str],
) -> float | None:
    if key not in data or data[key] is None:
        return None

    value = data[key]

    if isinstance(value, bool) or not isinstance(value, (int, float)):
        errors.append(f"{key} must be a number.")
        return None

    if minimum is not None and value < minimum:
        errors.append(f"{key} must be >= {minimum}.")

    if maximum is not None and value > maximum:
        errors.append(f"{key} must be <= {maximum}.")

    return float(value)


# -------------------------------------------------------------------
# 1. DEMOGRAPHY
# -------------------------------------------------------------------

def validate_demography(data: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []

    population = _number(
        data,
        "population",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    households = _number(
        data,
        "households",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    male = _number(
        data,
        "male_population",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    female = _number(
        data,
        "female_population",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    growth_rate = _number(
        data,
        "population_growth_rate",
        minimum=-100,
        maximum=100,
        errors=errors,
        warnings=warnings,
    )

    if population is not None and households is not None:
        if households > population:
            errors.append("households cannot exceed population.")

        if households == 0 and population > 0:
            warnings.append("Population is greater than zero but households is zero.")

    if population is not None and male is not None and female is not None:
        if male + female != population:
            warnings.append(
                "male_population + female_population does not equal population."
            )

    if growth_rate is not None and growth_rate > 10:
        warnings.append("Population growth rate is unusually high.")

    return _finalize(errors, warnings)


# -------------------------------------------------------------------
# 2. COMMUNITY INFRASTRUCTURE
# -------------------------------------------------------------------

def validate_community_infrastructure(data: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []

    schools = _number(
        data,
        "schools",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    hospitals = _number(
        data,
        "hospitals",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    health_centers = _number(
        data,
        "health_centers",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    water_coverage = _number(
        data,
        "water_supply_coverage_percent",
        minimum=0,
        maximum=100,
        errors=errors,
        warnings=warnings,
    )

    sanitation = _number(
        data,
        "sanitation_coverage_percent",
        minimum=0,
        maximum=100,
        errors=errors,
        warnings=warnings,
    )

    electricity = _number(
        data,
        "electricity_coverage_percent",
        minimum=0,
        maximum=100,
        errors=errors,
        warnings=warnings,
    )

    if schools == 0:
        warnings.append("No schools reported.")

    if hospitals == 0 and health_centers == 0:
        warnings.append("No hospital or health center reported.")

    if water_coverage is not None and water_coverage < 50:
        warnings.append("Water supply coverage is below 50%.")

    if sanitation is not None and sanitation < 50:
        warnings.append("Sanitation coverage is below 50%.")

    if electricity is not None and electricity < 50:
        warnings.append("Electricity coverage is below 50%.")

    return _finalize(errors, warnings)


# -------------------------------------------------------------------
# 3. INDUSTRIAL ACTIVITIES
# -------------------------------------------------------------------

def validate_industrial_activities(data: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []

    industrial_units = _number(
        data,
        "industrial_units",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    employment = _number(
        data,
        "industrial_employment",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    waste = _number(
        data,
        "industrial_waste_tonnes_per_day",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    if industrial_units == 0 and (
        employment is not None and employment > 0
    ):
        warnings.append(
            "Industrial employment is reported even though industrial_units is zero."
        )

    if waste is not None and waste > 1000:
        warnings.append("Reported industrial waste is unusually high.")

    return _finalize(errors, warnings)


# -------------------------------------------------------------------
# 4. NATURAL RESOURCES
# -------------------------------------------------------------------

def validate_natural_resources(data: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []

    water_bodies = _number(
        data,
        "water_bodies",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    groundwater_depth = _number(
        data,
        "groundwater_depth_m",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    forest_area = _number(
        data,
        "forest_area_km2",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    agricultural_area = _number(
        data,
        "agricultural_area_km2",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    if groundwater_depth is not None and groundwater_depth > 100:
        warnings.append("Groundwater depth is unusually high.")

    if (
        forest_area is not None
        and agricultural_area is not None
        and forest_area == 0
        and agricultural_area == 0
    ):
        warnings.append(
            "Neither forest area nor agricultural area has been reported."
        )

    if water_bodies == 0:
        warnings.append("No water bodies reported.")

    return _finalize(errors, warnings)


# -------------------------------------------------------------------
# 5. TERRAIN
# -------------------------------------------------------------------

def validate_terrain(data: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []

    elevation = _number(
        data,
        "elevation_m",
        minimum=-500,
        maximum=9000,
        errors=errors,
        warnings=warnings,
    )

    slope = _number(
        data,
        "slope_percent",
        minimum=0,
        maximum=200,
        errors=errors,
        warnings=warnings,
    )

    area = _number(
        data,
        "area_km2",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    if slope is not None and slope > 30:
        warnings.append("Terrain has a steep slope.")

    if area == 0:
        errors.append("Terrain area cannot be zero.")

    return _finalize(errors, warnings)


# -------------------------------------------------------------------
# 6. ECONOMIC CONDITIONS
# -------------------------------------------------------------------

def validate_economic_conditions(data: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []

    unemployment = _number(
        data,
        "unemployment_rate_percent",
        minimum=0,
        maximum=100,
        errors=errors,
        warnings=warnings,
    )

    literacy = _number(
        data,
        "literacy_rate_percent",
        minimum=0,
        maximum=100,
        errors=errors,
        warnings=warnings,
    )

    average_income = _number(
        data,
        "average_annual_income",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    poverty = _number(
        data,
        "poverty_rate_percent",
        minimum=0,
        maximum=100,
        errors=errors,
        warnings=warnings,
    )

    if unemployment is not None and unemployment > 25:
        warnings.append("Unemployment rate is unusually high.")

    if literacy is not None and literacy < 50:
        warnings.append("Literacy rate is below 50%.")

    if poverty is not None and poverty > 50:
        warnings.append("Poverty rate is above 50%.")

    if average_income == 0:
        warnings.append("Average annual income is reported as zero.")

    return _finalize(errors, warnings)


# -------------------------------------------------------------------
# 7. CULTURAL SIGNIFICANCE
# -------------------------------------------------------------------

def validate_cultural_significance(data: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []

    heritage_sites = _number(
        data,
        "heritage_sites",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    cultural_events = _number(
        data,
        "annual_cultural_events",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    protected_sites = _number(
        data,
        "protected_sites",
        minimum=0,
        errors=errors,
        warnings=warnings,
    )

    if heritage_sites is not None and protected_sites is not None:
        if protected_sites > heritage_sites:
            errors.append(
                "protected_sites cannot exceed heritage_sites."
            )

    if cultural_events is not None and cultural_events > 365:
        errors.append(
            "annual_cultural_events cannot exceed 365."
        )

    if heritage_sites == 0:
        warnings.append("No heritage sites reported.")

    return _finalize(errors, warnings)


# -------------------------------------------------------------------
# GENERIC VALIDATOR
# -------------------------------------------------------------------

VALIDATORS = {
    "demography": validate_demography,
    "community_infrastructure": validate_community_infrastructure,
    "industrial_activities": validate_industrial_activities,
    "natural_resources": validate_natural_resources,
    "terrain": validate_terrain,
    "economic_conditions": validate_economic_conditions,
    "cultural_significance": validate_cultural_significance,
}


def validate_parameter(
    category: str,
    data: dict[str, Any],
) -> dict[str, Any]:
    validator = VALIDATORS.get(category)

    if validator is None:
        return {
            "status": INVALID,
            "errors": [f"Unsupported category: {category}"],
            "warnings": [],
        }

    return validator(data)