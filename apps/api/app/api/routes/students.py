from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.api.deps.student_auth import assert_student_access, require_student
from app.schemas.auth import AuthUser
from app.schemas.resume_optimizer import ResumeOptimizeRequest, ResumeOptimizeResponse
from app.schemas.students import (
    ApplicationSubmitRequest,
    ApplicationSubmitResponse,
    AssessmentGenerateRequest,
    AssessmentGenerateResponse,
    AssessmentResult,
    AssessmentSubmitRequest,
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
    ResumeExtractResponse,
    StudentAbilityTrendResponse,
    StudentApplicationsResponse,
    StudentDashboardResponse,
    StudentOverviewResponse,
)
from app.services.application_service import (
    analyze_resume,
    extract_resume_text,
    generate_assessment,
    submit_application,
    submit_assessment,
)
from app.services.resume_optimizer_agent_service import optimize_resume_agent_stream, optimize_resume_with_agent
from app.services.resume_optimizer_service import optimize_resume
from app.services.student_service import (
    get_student_ability_trend,
    get_student_applications,
    get_student_dashboard,
    get_student_overview,
)

router = APIRouter()


@router.get("/{student_id}/overview", response_model=StudentOverviewResponse)
def student_overview(student_id: str, user: AuthUser = Depends(require_student)):
    assert_student_access(user, student_id)
    return get_student_overview(student_id)


@router.get("/{student_id}/dashboard", response_model=StudentDashboardResponse)
def student_dashboard(student_id: str, user: AuthUser = Depends(require_student)):
    assert_student_access(user, student_id)
    return get_student_dashboard(student_id)


@router.get("/{student_id}/applications", response_model=StudentApplicationsResponse)
def student_applications(student_id: str, user: AuthUser = Depends(require_student)):
    assert_student_access(user, student_id)
    return get_student_applications(student_id)


@router.get("/{student_id}/ability-trend", response_model=StudentAbilityTrendResponse)
def student_ability_trend(student_id: str, user: AuthUser = Depends(require_student)):
    assert_student_access(user, student_id)
    return get_student_ability_trend(student_id)


@router.post("/{student_id}/resume-analysis", response_model=ResumeAnalysisResponse)
def student_resume_analysis(student_id: str, payload: ResumeAnalysisRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, student_id)
    return analyze_resume(student_id=student_id, payload=payload)


def _resume_optimizer_use_langgraph() -> bool:
    import os

    return os.environ.get("RESUME_OPTIMIZER_ENGINE", "langgraph").lower() != "legacy"


@router.post("/{student_id}/resume-optimize", response_model=ResumeOptimizeResponse)
def student_resume_optimize(student_id: str, payload: ResumeOptimizeRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, student_id)
    body = payload.model_copy(update={"student_id": student_id})
    if _resume_optimizer_use_langgraph():
        return optimize_resume_with_agent(body)
    return optimize_resume(body)


@router.post("/{student_id}/resume-optimize/stream")
def student_resume_optimize_stream(student_id: str, payload: ResumeOptimizeRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, student_id)
    body = payload.model_copy(update={"student_id": student_id})
    return StreamingResponse(
        optimize_resume_agent_stream(body),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.post("/{student_id}/resume-extract", response_model=ResumeExtractResponse)
async def student_resume_extract(student_id: str, file: UploadFile = File(...), user: AuthUser = Depends(require_student)):
    assert_student_access(user, student_id)
    file_bytes = await file.read()
    try:
        return extract_resume_text(file_name=file.filename or "resume", file_bytes=file_bytes, content_type=file.content_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{student_id}/assessment/generate", response_model=AssessmentGenerateResponse)
def student_assessment_generate(student_id: str, payload: AssessmentGenerateRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, student_id)
    return generate_assessment(student_id=student_id, payload=payload)


@router.post("/{student_id}/assessment/submit", response_model=AssessmentResult)
def student_assessment_submit(student_id: str, payload: AssessmentSubmitRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, student_id)
    return submit_assessment(student_id=student_id, payload=payload)


@router.post("/{student_id}/applications/submit", response_model=ApplicationSubmitResponse)
def student_application_submit(student_id: str, payload: ApplicationSubmitRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, student_id)
    try:
        return submit_application(student_id=student_id, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
