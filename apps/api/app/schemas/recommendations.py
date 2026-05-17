from pydantic import BaseModel, Field


class RecommendationItem(BaseModel):
    job_id: str
    title: str
    company: str
    match_score: float = Field(..., ge=0, le=100)
    reasons: list[str]


class RecommendationResponse(BaseModel):
    student_id: str
    items: list[RecommendationItem]
