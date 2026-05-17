from fastapi import APIRouter, Query

from app.schemas.recommendations import RecommendationResponse
from app.services.recommendation_service import get_job_recommendations

router = APIRouter()


@router.get("/jobs", response_model=RecommendationResponse)
def recommendations(student_id: str = Query(..., description="Student id")):
    return get_job_recommendations(student_id)
