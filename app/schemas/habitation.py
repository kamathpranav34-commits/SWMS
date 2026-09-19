from pydantic import BaseModel, Field

class HabitationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    level: str = "VILLAGE"
    description: str | None = None

class HabitationResponse(BaseModel):
    id: str
    name: str
    level: str
    description: str | None
    created_by: str

    model_config = {"from_attributes": True}
