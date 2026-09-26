from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.db.database import init_db

app = FastAPI(title="SWMS Backend", version="1.0.0", description="Smart Waste Management Simulator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500"],  # Restrict this in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/health", tags=["system"])
def health():
    return {"status": "ok", "service": "swms-backend"}

app.include_router(api_router, prefix="/api/v1")
