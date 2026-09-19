from pydantic import BaseModel, Field

class ScenarioCreate(BaseModel):
    simulation_id: str
    name: str
    scenario_type: str
    parameters: dict = Field(default_factory=dict)

class ScenarioResponse(BaseModel):
    id: str
    simulation_id: str
    name: str
    scenario_type: str
    parameters: dict

    model_config = {"from_attributes": True}
