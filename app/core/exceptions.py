from fastapi import Request
from fastapi.responses import JSONResponse

class SWMSValidationError(Exception):
    def __init__(self, message: str, details=None):
        self.message = message
        self.details = details or []

async def swms_validation_exception_handler(request: Request, exc: SWMSValidationError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": {"code": "VALIDATION_ERROR", "message": exc.message, "details": exc.details}},
    )
