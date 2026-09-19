from pydantic import BaseModel

class ImportResponse(BaseModel):
    id: str
    filename: str
    status: str
    task_id: str | None = None
    error_message: str | None = None

    model_config = {"from_attributes": True}
