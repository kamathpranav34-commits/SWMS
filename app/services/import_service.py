from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.db.models.data_import import DataImport
from app.storage.minio_client import put_object
from app.workers.import_tasks import process_import

async def save_import(db: Session, habitation_id: str, user_id: str, file: UploadFile):
    content = await file.read()
    object_key = f"imports/{habitation_id}/{file.filename}"
    put_object(object_key, content, file.content_type or "application/octet-stream")

    item = DataImport(
        habitation_id=habitation_id,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        object_key=object_key,
        size_bytes=len(content),
        status="UPLOADED",
        created_by=user_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    task = process_import.delay(item.id)
    item.task_id = task.id
    item.status = "QUEUED"
    db.commit()
    db.refresh(item)
    return item
