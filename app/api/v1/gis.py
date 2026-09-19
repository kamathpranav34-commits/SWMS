from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.shape import from_shape
from shapely.geometry import shape
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models.habitation import Habitation
from app.db.models.map_layer import MapLayer
from app.db.models.user import User
from app.schemas.gis import LayerCreate

router = APIRouter()

@router.post("/{habitation_id}/layers", status_code=201)
def create_layer(
    habitation_id: str,
    payload: LayerCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.get(Habitation, habitation_id):
        raise HTTPException(404, "Habitation not found")
    try:
        geom = shape(payload.feature.geometry)
        if geom.is_empty or not geom.is_valid:
            raise ValueError("Geometry is empty or invalid")
        geom_wkb = from_shape(geom, srid=4326)
    except Exception as exc:
        raise HTTPException(422, f"Invalid GeoJSON geometry: {exc}")

    layer = MapLayer(
        habitation_id=habitation_id,
        name=payload.name,
        layer_type=payload.layer_type,
        geometry=geom_wkb,
        properties=payload.feature.properties,
        created_by=user.id,
    )
    db.add(layer)
    db.commit()
    db.refresh(layer)
    return {"id": layer.id, "name": layer.name, "layer_type": layer.layer_type}

@router.get("/{habitation_id}/layers")
def list_layers(habitation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not db.get(Habitation, habitation_id):
        raise HTTPException(404, "Habitation not found")
    return [
        {"id": x.id, "name": x.name, "layer_type": x.layer_type, "properties": x.properties}
        for x in db.query(MapLayer).filter(MapLayer.habitation_id == habitation_id).all()
    ]
