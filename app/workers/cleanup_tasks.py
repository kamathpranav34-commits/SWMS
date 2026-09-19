from app.workers.celery_app import celery_app

@celery_app.task
def cleanup_task():
    return {"status": "ok"}
