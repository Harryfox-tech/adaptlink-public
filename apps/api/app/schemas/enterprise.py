from typing import Optional

from pydantic import BaseModel

from app.schemas.students import ApplicationPackage


class Company(BaseModel):
    company_id: str
    name: str
    industry: str
    size: str


class Job(BaseModel):
    job_id: str
    company_id: str
    title: str
    location: str
    required_skills: list[str]
    description: Optional[str] = None


class EnterpriseJobCreateRequest(BaseModel):
    title: str
    location: str
    required_skills: list[str] = []
    description: Optional[str] = None


class CandidateAbilitySnapshot(BaseModel):
    ability_key: str
    ability_label: str
    score: float
    trend: str


class CandidateSimulationSummary(BaseModel):
    session_id: str
    simulation_type: str
    overall_score: float
    summary: str
    created_at: str


class CandidateRecommendation(BaseModel):
    job_id: str
    title: str
    company: str
    match_score: float


class CandidateDetailResponse(BaseModel):
    student_id: str
    name: str
    major: str
    grade: str
    overall_score: float
    strengths: list[str]
    risk_flags: list[str]
    latest_simulations: list[CandidateSimulationSummary]
    ability_snapshot: list[CandidateAbilitySnapshot]
    recommendations: list[CandidateRecommendation]
    application_packages: list[ApplicationPackage] = []


class CandidateListItem(BaseModel):
    student_id: str
    name: str
    major: str
    grade: str
    overall_score: float
    risk_level: str
    strengths: list[str]
    latest_simulation_type: str
    latest_recommendation_title: str | None = None
    latest_recommendation_company: str | None = None
    latest_recommendation_score: float | None = None


class TalentPoolResponse(BaseModel):
    items: list[CandidateListItem]


class EnterpriseApplicationListItem(BaseModel):
    application_id: str
    student_id: str
    job_id: str | None = None
    company_id: str | None = None
    job_title: str
    company: str
    status: str
    applied_at: str
    resume_name: str | None = None
    resume_fit_score: float | None = None
    assessment_score: float | None = None


class EnterpriseApplicationsResponse(BaseModel):
    items: list[EnterpriseApplicationListItem]


class EnterpriseApplicationPackageResponse(BaseModel):
    package: ApplicationPackage | None = None


class EnterpriseMetricItem(BaseModel):
    title: str
    value: str
    delta: str
    hint: str


class EnterpriseWarningItem(BaseModel):
    message: str


class EnterpriseFunnelItem(BaseModel):
    stage: str
    value: int


class EnterpriseDashboardResponse(BaseModel):
    metrics: list[EnterpriseMetricItem]
    warnings: list[EnterpriseWarningItem]
    funnel: list[EnterpriseFunnelItem]
    gap_words: list[str]


class JobTemplateItem(BaseModel):
    name: str
    dept: str
    use_count: str


class EnterpriseJobsCenterResponse(BaseModel):
    templates: list[JobTemplateItem]
    default_weights: dict[str, float]
    default_required_skills: list[str]


class EnterpriseJobModelGenerateRequest(BaseModel):
    job_name: str
    department: str
    level: str
    work_mode: str
    required_skills: list[str] = []
    weight_hints: dict[str, float] = {}
    description: str


class EnterpriseJobModelSaveRequest(BaseModel):
    job_name: str
    department: str
    level: str
    work_mode: str
    required_skills: list[str] = []
    weights: dict[str, float] = {}
    summary: str = ""
    interview_questions: list[str] = []


class EnterpriseJobModelActionResponse(BaseModel):
    model_id: str
    job_name: str
    department: str
    level: str
    work_mode: str
    required_skills: list[str]
    weights: dict[str, float]
    summary: str
    interview_questions: list[str]
    engine: str
    saved: bool
    created_at: str


class RecruitmentFlowItem(BaseModel):
    stage: str
    count: int
    owner: str
    sla: str


class InterviewTemplateItem(BaseModel):
    stage: str
    ability: str
    question: str


class EnterpriseRecruitmentResponse(BaseModel):
    flow: list[RecruitmentFlowItem]
    templates: list[InterviewTemplateItem]


class AnalyticsChannelItem(BaseModel):
    channel: str
    conversion: int
    quality: str
    schools: str
    note: str


class AnalyticsSchoolHeatItem(BaseModel):
    school: str
    applicants: int
    fit: str
    gap: str


class EnterpriseAnalyticsResponse(BaseModel):
    channel_rows: list[AnalyticsChannelItem]
    heat_rows: list[AnalyticsSchoolHeatItem]
    gap_trend: dict[str, int]


class PartnershipSchoolItem(BaseModel):
    school: str
    active: int
    fit: str
    contact: str
    score: str


class PartnershipActivityItem(BaseModel):
    date: str
    item: str
    owner: str
    status: str


class EnterprisePartnershipsResponse(BaseModel):
    schools: list[PartnershipSchoolItem]
    activities: list[PartnershipActivityItem]


class RolePermissionItem(BaseModel):
    role: str
    perms: str
    scope: str


class GovernanceRuleItem(BaseModel):
    item: str
    rule: str


class EnterpriseSettingsResponse(BaseModel):
    role_rows: list[RolePermissionItem]
    governance_rows: list[GovernanceRuleItem]


class EnterpriseAnalyticsFilterRequest(BaseModel):
    job_family: str = ""
    school: str = ""
    ability_gap: str = ""
    time_range: str = ""


class EnterpriseRecruitmentFeedbackRequest(BaseModel):
    candidate_id: str
    job_id: str
    business_score: float
    communication_score: float
    problem_solving_score: float
    conclusion: str
    draft: bool = False


class EnterpriseRecruitmentFeedbackResponse(BaseModel):
    feedback_id: str
    saved: bool
    draft: bool
    created_at: str


class EnterprisePartnershipQueryRequest(BaseModel):
    query: str = ""


class EnterpriseSettingsUpdateRequest(BaseModel):
    role_rows: list[RolePermissionItem]
    governance_rows: list[GovernanceRuleItem]


class EnterpriseSettingsUpdateResponse(BaseModel):
    saved: bool
    updated_at: str
