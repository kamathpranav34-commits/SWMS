from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models.data_import import DataImport
from app.db.models.habitation import Habitation
from app.db.models.user import User
from app.services.import_service import save_import
from app.schemas.imports import ImportResponse

router = APIRouter()

@router.post("", response_model=ImportResponse, status_code=202)
async def create_import(
    habitation_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.get(Habitation, habitation_id):
        raise HTTPException(404, "Habitation not found")
    allowed = {".csv", ".xlsx", ".geojson", ".json"}
    suffix = "." + file.filename.lower().split(".")[-1] if "." in file.filename else ""
    if suffix not in allowed:
        raise HTTPException(415, "Supported files: CSV, XLSX, GeoJSON, JSON")
    item = await save_import(db, habitation_id, user.id, file)
    return item

@router.get("/{import_id}", response_model=ImportResponse)
def get_import(import_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(DataImport, import_id)
    if not item:
        raise HTTPException(404, "Import not found")
    return item
