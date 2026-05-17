from pydantic import BaseModel


class School(BaseModel):
    school_id: str
    name: str
    province: str


class StudentSummary(BaseModel):
    user_id: str
    name: str
    major: str
    risk_level: str
    overall_score: float
    latest_simulation_type: str


class SchoolStudentAbilitySnapshot(BaseModel):
    ability_key: str
    ability_label: str
    score: float
    trend: str


class SchoolStudentSimulation(BaseModel):
    session_id: str
    simulation_type: str
    overall_score: float
    summary: str
    created_at: str


class SchoolInterventionItem(BaseModel):
    title: str
    priority: str
    owner: str
    due_date: str


class SchoolStudentDetailResponse(BaseModel):
    student_id: str
    name: str
    major: str
    grade: str
    risk_level: str
    overall_score: float
    focus_areas: list[str]
    latest_simulations: list[SchoolStudentSimulation]
    ability_snapshot: list[SchoolStudentAbilitySnapshot]
    interventions: list[SchoolInterventionItem]


class SchoolMetricItem(BaseModel):
    title: str
    value: str
    delta: str
    hint: str


class MajorGapItem(BaseModel):
    major: str
    gap: str
    level: str


class SchoolDashboardResponse(BaseModel):
    metrics: list[SchoolMetricItem]
    major_gaps: list[MajorGapItem]


class CurriculumMapItem(BaseModel):
    course: str
    ability: str
    contribution: str
    market: str


class SchoolCurriculumResponse(BaseModel):
    map_rows: list[CurriculumMapItem]
    optimize_suggestions: list[str]


class SchoolCurriculumOptimizeRequest(BaseModel):
    major: str
    objective: str
    context_note: str = ""
    current_rows: list[CurriculumMapItem] = []


class SchoolCurriculumOptimizeResponse(BaseModel):
    plan_id: str
    major: str
    objective: str
    map_rows: list[CurriculumMapItem]
    optimize_suggestions: list[str]
    engine: str
    saved: bool
    created_at: str


class SchoolProjectItem(BaseModel):
    name: str
    need: str
    slots: int
    status: str


class SchoolProjectsResponse(BaseModel):
    projects: list[SchoolProjectItem]


class EmploymentMajorItem(BaseModel):
    major: str
    target: str
    match: str
    quality: str


class SchoolEmploymentResponse(BaseModel):
    major_rows: list[EmploymentMajorItem]


class InterventionStrategyItem(BaseModel):
    level: str
    strategy: str
    owner: str


class SchoolInterventionsResponse(BaseModel):
    strategies: list[InterventionStrategyItem]
    rules: list[str]


class SchoolPartnerItem(BaseModel):
    company: str
    focus: str
    status: str


class SchoolFeedbackItem(BaseModel):
    company: str
    praise: str
    gap: str
    priority: str


class SchoolPartnershipsResponse(BaseModel):
    partners: list[SchoolPartnerItem]
    feedback_rows: list[SchoolFeedbackItem]


class ReportTemplateItem(BaseModel):
    type: str
    focus: str
    output: str


class SchoolAnalyticsResponse(BaseModel):
    report_rows: list[ReportTemplateItem]


class RolePermissionItem(BaseModel):
    role: str
    perms: str
    scope: str


class GovernanceRuleItem(BaseModel):
    item: str
    rule: str


class SchoolSettingsResponse(BaseModel):
    role_rows: list[RolePermissionItem]
    governance_rows: list[GovernanceRuleItem]


class SchoolProjectPublishRequest(BaseModel):
    name: str
    need: str
    slots: int
    status: str = "招募中"


class SchoolProjectPublishResponse(BaseModel):
    project_id: str
    name: str
    need: str
    slots: int
    status: str
    saved: bool
    created_at: str


class SchoolProjectQuestionGenerateRequest(BaseModel):
    name: str
    need: str


class SchoolProjectQuestionGenerateResponse(BaseModel):
    questions: list[str]
    engine: str


class SchoolAnalyticsExportRequest(BaseModel):
    time_range: str = ""
    school: str = ""
    major: str = ""
    version: str = ""
    export_type: str


class SchoolAnalyticsExportResponse(BaseModel):
    export_id: str
    export_type: str
    saved: bool
    created_at: str


class SchoolSettingsUpdateRequest(BaseModel):
    role_rows: list[RolePermissionItem]
    governance_rows: list[GovernanceRuleItem]


class SchoolSettingsUpdateResponse(BaseModel):
    saved: bool
    updated_at: str
