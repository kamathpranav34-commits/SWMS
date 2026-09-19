from fastapi import APIRouter
from app.api.v1 import auth, habitations, parameters, imports, gis, simulations, scenarios, reports, chat

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(habitations.router, prefix="/habitations", tags=["habitations"])
api_router.include_router(parameters.router, prefix="/habitations", tags=["parameters"])
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
api_router.include_router(gis.router, prefix="/habitations", tags=["gis"])
api_router.include_router(simulations.router, prefix="/simulations", tags=["simulations"])
api_router.include_router(scenarios.router, prefix="/scenarios", tags=["scenarios"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
