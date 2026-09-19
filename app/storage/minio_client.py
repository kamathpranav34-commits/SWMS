from io import BytesIO
from minio import Minio
from minio.error import S3Error
from app.core.config import settings

client = Minio(
    settings.minio_endpoint,
    access_key=settings.minio_access_key,
    secret_key=settings.minio_secret_key,
    secure=False,
)

def ensure_bucket():
    if not client.bucket_exists(settings.minio_bucket):
        client.make_bucket(settings.minio_bucket)

def put_object(object_key: str, content: bytes, content_type: str):
    ensure_bucket()
    client.put_object(
        settings.minio_bucket,
        object_key,
        BytesIO(content),
        length=len(content),
        content_type=content_type,
    )

def get_object(object_key: str) -> bytes:
    ensure_bucket()
    response = client.get_object(settings.minio_bucket, object_key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()
