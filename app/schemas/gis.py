from typing import Any
from pydantic import BaseModel, Field

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: dict[str, Any]
    properties: dict[str, Any] = Field(default_factory=dict)

class LayerCreate(BaseModel):
    name: str
    layer_type: str
    feature: GeoJSONFeature
