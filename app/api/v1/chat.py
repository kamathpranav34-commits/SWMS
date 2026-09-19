from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.db.models.user import User

router = APIRouter()

@router.post("")
def chat(payload: dict, user: User = Depends(get_current_user)):
    # Intent/NLP/LLM integration can be connected here later.
    message = str(payload.get("message", "")).strip()
    return {
        "message": "Chat endpoint is ready for simulator integration.",
        "received": message,
        "next_step": "Map the detected intent to /simulations or /scenarios APIs."
    }
