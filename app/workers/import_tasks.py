from io import BytesIO
import json
from celery import shared_task
from app.db.database import SessionLocal
from app.db.models.data_import import DataImport
from app.storage.minio_client import get_object
from app.utils.file_parser import parse_import

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def process_import(self, import_id: str):
    db = SessionLocal()
    try:
        item = db.get(DataImport, import_id)
        if not item:
            return {"status": "missing"}
        item.status = "PROCESSING"
        db.commit()

        content = get_object(item.object_key)
        parsed = parse_import(item.filename, content)
        item.status = "COMPLETED"
        item.error_message = None
        db.commit()
        return {"import_id": import_id, "records": len(parsed) if isinstance(parsed, list) else 1}
    except Exception as exc:
        if 'item' in locals() and item:
            item.status = "FAILED"
            item.error_message = str(exc)
            db.commit()
        raise
    finally:
        db.close()
