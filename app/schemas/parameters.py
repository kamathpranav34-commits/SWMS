from typing import Any
from pydantic import BaseModel, Field

PARAMETER_CATEGORIES = {
    "demography",
    "community_infrastructure",
    "industrial_activities",
    "natural_resources",
    "terrain",
    "economic_conditions",
    "cultural_significance",
}

class ParameterUpdate(BaseModel):
    data: dict[str, Any]
    expected_version: int | None = Field(default=None, ge=1)

class ParameterResponse(BaseModel):
    category: str
    version: int
    data: dict[str, Any]

    model_config = {"from_attributes": True}
