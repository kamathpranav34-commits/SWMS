from pydantic import BaseModel, Field

class SimulationCreate(BaseModel):
    habitation_id: str
    name: str = "SWMS 20-Year Simulation"
    start_year: int = Field(default=1, ge=1)
    duration_years: int = Field(default=20, ge=1, le=100)

class SimulationResponse(BaseModel):
    id: str
    habitation_id: str
    name: str
    start_year: int
    duration_years: int
    status: str

    model_config = {"from_attributes": True}
