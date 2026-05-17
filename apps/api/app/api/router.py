from fastapi import APIRouter
from app.api.routes import students, enterprise, school, simulations, recommendations, auth

api_router = APIRouter()
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(enterprise.router, prefix="/enterprise", tags=["enterprise"])
api_router.include_router(school.router, prefix="/school", tags=["school"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(simulations.router, prefix="/simulations", tags=["simulations"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
