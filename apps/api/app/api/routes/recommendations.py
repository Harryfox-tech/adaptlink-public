from fastapi import APIRouter, Depends, Query

from app.api.deps.student_auth import assert_student_access, require_student
from app.schemas.auth import AuthUser
from app.schemas.recommendations import RecommendationResponse
from app.services.recommendation_service import get_job_recommendations

router = APIRouter()


@router.get("/jobs", response_model=RecommendationResponse)
def recommendations(
    student_id: str = Query(..., description="Student id"),
    user: AuthUser = Depends(require_student),
):
    assert_student_access(user, student_id)
    return get_job_recommendations(student_id)
