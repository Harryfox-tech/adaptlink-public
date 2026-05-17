from fastapi import APIRouter, Depends, Header, HTTPException, Query

from app.schemas.enterprise import (
    CandidateDetailResponse,
    EnterpriseApplicationPackageResponse,
    EnterpriseApplicationsResponse,
    EnterpriseApplicationListItem,
    EnterpriseJobCreateRequest,
    EnterpriseAnalyticsResponse,
    EnterpriseAnalyticsFilterRequest,
    EnterpriseDashboardResponse,
    EnterpriseJobModelActionResponse,
    EnterpriseJobModelGenerateRequest,
    EnterpriseJobModelSaveRequest,
    EnterpriseJobsCenterResponse,
    EnterprisePartnershipsResponse,
    EnterprisePartnershipQueryRequest,
    EnterpriseRecruitmentResponse,
    EnterpriseRecruitmentFeedbackRequest,
    EnterpriseRecruitmentFeedbackResponse,
    EnterpriseSettingsResponse,
    EnterpriseSettingsUpdateRequest,
    EnterpriseSettingsUpdateResponse,
    Job,
    TalentPoolResponse,
)
from app.services import auth_service
from app.services.application_service import get_application_package_by_id, list_enterprise_applications
from app.services.enterprise_service import (
    create_job,
    get_candidate_detail,
    get_enterprise_analytics,
    get_enterprise_dashboard,
    get_enterprise_jobs_center,
    get_enterprise_partnerships,
    get_enterprise_recruitment,
    get_enterprise_settings,
    generate_enterprise_job_model,
    filter_enterprise_analytics,
    list_jobs,
    list_talent_pool,
    query_enterprise_partnerships,
    save_recruitment_feedback,
    save_enterprise_settings,
    save_enterprise_job_model,
)

router = APIRouter()


def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    if authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None


def _require_enterprise_ctx(authorization: str | None = Header(default=None)) -> tuple[str, str]:
    token = _extract_token(authorization)
    try:
        user = auth_service.require_user(token or "", role="enterprise")
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    company_id = auth_service.get_enterprise_company_id(user.id)
    if not company_id:
        raise HTTPException(status_code=403, detail="企业账号未绑定公司")
    return (user.id, company_id)


@router.get("/jobs", response_model=list[Job])
def enterprise_jobs(ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, company_id = ctx
    return list_jobs(company_id=company_id)


@router.post("/jobs", response_model=Job)
def enterprise_create_job(payload: EnterpriseJobCreateRequest, ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    enterprise_user_id, company_id = ctx
    try:
        return create_job(company_id=company_id, created_by=enterprise_user_id, payload=payload.model_dump(mode="python"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/talent-pool", response_model=TalentPoolResponse)
def enterprise_talent_pool(
    keyword: str | None = Query(default=None),
    risk_level: str | None = Query(default=None),
    min_score: float | None = Query(default=None),
    ctx: tuple[str, str] = Depends(_require_enterprise_ctx),
):
    _enterprise_user_id, _company_id = ctx
    return list_talent_pool(keyword=keyword, risk_level=risk_level, min_score=min_score)


@router.get("/candidates/{student_id}", response_model=CandidateDetailResponse)
def enterprise_candidate_detail(student_id: str, ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, company_id = ctx
    return get_candidate_detail(student_id, company_id=company_id)


@router.get("/applications", response_model=EnterpriseApplicationsResponse)
def enterprise_applications(
    job_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    ctx: tuple[str, str] = Depends(_require_enterprise_ctx),
):
    _enterprise_user_id, company_id = ctx
    items = list_enterprise_applications(company_id=company_id, job_id=job_id, status=status, keyword=keyword, limit=limit, offset=offset)
    return EnterpriseApplicationsResponse(items=[EnterpriseApplicationListItem(**it) for it in items])


@router.get("/applications/{application_id}/package", response_model=EnterpriseApplicationPackageResponse)
def enterprise_application_package(application_id: str, ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, company_id = ctx
    package = get_application_package_by_id(application_id)
    if not package:
        return EnterpriseApplicationPackageResponse(package=None)
    # tenant guard: only return if belongs to this company (when available)
    if package.company_id and package.company_id != company_id:
        raise HTTPException(status_code=403, detail="无权限")
    return EnterpriseApplicationPackageResponse(package=package)


@router.get("/dashboard", response_model=EnterpriseDashboardResponse)
def enterprise_dashboard(ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, _company_id = ctx
    return get_enterprise_dashboard()


@router.get("/jobs-center", response_model=EnterpriseJobsCenterResponse)
def enterprise_jobs_center(ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, _company_id = ctx
    return get_enterprise_jobs_center()


@router.post("/jobs-center/generate-model", response_model=EnterpriseJobModelActionResponse)
def enterprise_jobs_center_generate_model(payload: EnterpriseJobModelGenerateRequest, ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, _company_id = ctx
    return generate_enterprise_job_model(payload)


@router.post("/jobs-center/save-model", response_model=EnterpriseJobModelActionResponse)
def enterprise_jobs_center_save_model(payload: EnterpriseJobModelSaveRequest, ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, _company_id = ctx
    return save_enterprise_job_model(payload)


@router.get("/recruitment", response_model=EnterpriseRecruitmentResponse)
def enterprise_recruitment(ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, _company_id = ctx
    return get_enterprise_recruitment()


@router.post("/recruitment/feedback", response_model=EnterpriseRecruitmentFeedbackResponse)
def enterprise_recruitment_feedback(payload: EnterpriseRecruitmentFeedbackRequest, ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, _company_id = ctx
    return save_recruitment_feedback(payload)


@router.get("/analytics", response_model=EnterpriseAnalyticsResponse)
def enterprise_analytics(ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, _company_id = ctx
    return get_enterprise_analytics()


@router.post("/analytics/filter", response_model=EnterpriseAnalyticsResponse)
def enterprise_analytics_filter(payload: EnterpriseAnalyticsFilterRequest, ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, _company_id = ctx
    return filter_enterprise_analytics(payload)


@router.get("/partnerships", response_model=EnterprisePartnershipsResponse)
def enterprise_partnerships(ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, _company_id = ctx
    return get_enterprise_partnerships()


@router.post("/partnerships/query", response_model=EnterprisePartnershipsResponse)
def enterprise_partnerships_query(payload: EnterprisePartnershipQueryRequest, ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, _company_id = ctx
    return query_enterprise_partnerships(payload)


@router.get("/settings", response_model=EnterpriseSettingsResponse)
def enterprise_settings(ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, _company_id = ctx
    return get_enterprise_settings()


@router.post("/settings", response_model=EnterpriseSettingsUpdateResponse)
def enterprise_settings_save(payload: EnterpriseSettingsUpdateRequest, ctx: tuple[str, str] = Depends(_require_enterprise_ctx)):
    _enterprise_user_id, _company_id = ctx
    return save_enterprise_settings(payload)
