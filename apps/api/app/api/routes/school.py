from fastapi import APIRouter, Query

from app.schemas.school import (
    SchoolAnalyticsResponse,
    SchoolAnalyticsExportRequest,
    SchoolAnalyticsExportResponse,
    SchoolCurriculumOptimizeRequest,
    SchoolCurriculumOptimizeResponse,
    SchoolCurriculumResponse,
    SchoolDashboardResponse,
    SchoolEmploymentResponse,
    SchoolInterventionsResponse,
    SchoolPartnershipsResponse,
    SchoolProjectsResponse,
    SchoolProjectPublishRequest,
    SchoolProjectPublishResponse,
    SchoolProjectQuestionGenerateRequest,
    SchoolProjectQuestionGenerateResponse,
    SchoolSettingsResponse,
    SchoolSettingsUpdateRequest,
    SchoolSettingsUpdateResponse,
    SchoolStudentDetailResponse,
    StudentSummary,
)
from app.services.school_service import (
    get_school_analytics,
    export_school_analytics,
    generate_school_project_questions,
    optimize_school_curriculum,
    get_school_curriculum,
    get_school_dashboard,
    get_school_employment,
    get_school_interventions,
    get_school_partnerships,
    get_school_projects,
    publish_school_project,
    save_school_settings,
    get_school_settings,
    get_school_student_detail,
    list_school_students,
)

router = APIRouter()


@router.get("/students", response_model=list[StudentSummary])
def school_students(
    risk_level: str | None = Query(default=None),
    min_score: float | None = Query(default=None),
):
    return list_school_students(risk_level=risk_level, min_score=min_score)


@router.get("/students/{student_id}", response_model=SchoolStudentDetailResponse)
def school_student_detail(student_id: str):
    return get_school_student_detail(student_id)


@router.get("/dashboard", response_model=SchoolDashboardResponse)
def school_dashboard():
    return get_school_dashboard()


@router.get("/curriculum", response_model=SchoolCurriculumResponse)
def school_curriculum():
    return get_school_curriculum()


@router.post("/curriculum/optimize", response_model=SchoolCurriculumOptimizeResponse)
def school_curriculum_optimize(payload: SchoolCurriculumOptimizeRequest):
    return optimize_school_curriculum(payload)


@router.get("/projects", response_model=SchoolProjectsResponse)
def school_projects():
    return get_school_projects()


@router.post("/projects/publish", response_model=SchoolProjectPublishResponse)
def school_projects_publish(payload: SchoolProjectPublishRequest):
    return publish_school_project(payload)


@router.post("/projects/generate-questions", response_model=SchoolProjectQuestionGenerateResponse)
def school_projects_generate_questions(payload: SchoolProjectQuestionGenerateRequest):
    return generate_school_project_questions(payload)


@router.get("/employment", response_model=SchoolEmploymentResponse)
def school_employment():
    return get_school_employment()


@router.get("/interventions", response_model=SchoolInterventionsResponse)
def school_interventions():
    return get_school_interventions()


@router.get("/partnerships", response_model=SchoolPartnershipsResponse)
def school_partnerships():
    return get_school_partnerships()


@router.get("/analytics", response_model=SchoolAnalyticsResponse)
def school_analytics():
    return get_school_analytics()


@router.post("/analytics/export", response_model=SchoolAnalyticsExportResponse)
def school_analytics_export(payload: SchoolAnalyticsExportRequest):
    return export_school_analytics(payload)


@router.get("/settings", response_model=SchoolSettingsResponse)
def school_settings():
    return get_school_settings()


@router.post("/settings", response_model=SchoolSettingsUpdateResponse)
def school_settings_save(payload: SchoolSettingsUpdateRequest):
    return save_school_settings(payload)
