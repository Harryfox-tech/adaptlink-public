from typing import Optional

from pydantic import BaseModel


class StudentProfile(BaseModel):
    user_id: str
    school_id: Optional[str] = None
    major: str
    grade: str
    bio: Optional[str] = None


class StudentOverviewResponse(BaseModel):
    user_id: str
    name: str
    major: str
    grade: str
    overall_score: float
    focus_areas: list[str]


class StudentDashboardMetric(BaseModel):
    title: str
    value: str
    delta: str
    hint: str


class ResumeSnapshot(BaseModel):
    resume_name: str
    target_job: str
    fit_score: float
    fit_summary: str
    created_at: str


class StudentDashboardResponse(BaseModel):
    student_id: str
    metrics: list[StudentDashboardMetric]
    today_suggestions: list[str]
    risk_summary: str
    resume_snapshot: ResumeSnapshot | None = None


class StudentApplicationItem(BaseModel):
    id: str
    job_id: str | None = None
    company_id: str | None = None
    job: str
    company: str
    status: str
    date: str
    resume_name: str | None = None
    resume_fit_score: float | None = None
    assessment_score: float | None = None
    has_assessment: bool = False


class StudentApplicationsResponse(BaseModel):
    student_id: str
    items: list[StudentApplicationItem]


class StudentAbilityTrendPoint(BaseModel):
    date: str
    score: float


class StudentAbilityTrendSeries(BaseModel):
    ability_key: str
    ability_label: str
    points: list[StudentAbilityTrendPoint]


class StudentAbilityTrendResponse(BaseModel):
    student_id: str
    series: list[StudentAbilityTrendSeries]


class TargetProfileInput(BaseModel):
    target_role: str
    business_focus: str
    personal_edge: str
    challenge_boundary: str
    success_signal: str


class ResumeAnalysisRequest(BaseModel):
    resume_name: str
    resume_text: str
    target_job: str


class ResumeExtractResponse(BaseModel):
    resume_name: str
    extracted_text: str
    file_type: str
    char_count: int


class ResumeExtractedInfo(BaseModel):
    candidate_name: str
    education: list[str]
    skills: list[str]
    projects: list[str]
    internship_experience: list[str]


class ResumeAnalysisResult(BaseModel):
    fit_score: float
    fit_summary: str
    highlights: list[str]
    risks: list[str]
    suggestions: list[str]


class ResumeAnalysisResponse(BaseModel):
    analysis_id: str
    student_id: str
    resume_name: str
    target_job: str
    extracted: ResumeExtractedInfo
    analysis: ResumeAnalysisResult
    created_at: str


class AssessmentQuestion(BaseModel):
    question_id: str
    section: str
    prompt: str
    input_type: str
    rubric: str


class AssessmentGenerateRequest(BaseModel):
    target_job: str
    target_profile: TargetProfileInput


class AssessmentGenerateResponse(BaseModel):
    assessment_id: str
    student_id: str
    target_job: str
    target_profile: TargetProfileInput
    questions: list[AssessmentQuestion]
    warmup_storyline: list[str]
    created_at: str


class AssessmentAnswer(BaseModel):
    question_id: str
    answer: str
    attachment_name: str | None = None


class AssessmentSubmitRequest(BaseModel):
    assessment_id: str
    target_job: str
    target_profile: TargetProfileInput
    answers: list[AssessmentAnswer]


class AssessmentDimensionScore(BaseModel):
    dimension: str
    score: float
    comment: str


class AssessmentResult(BaseModel):
    assessment_id: str
    overall_score: float
    summary: str
    dimensions: list[AssessmentDimensionScore]
    recommendations: list[str]
    created_at: str


class ApplicationSubmitRequest(BaseModel):
    job_id: str
    job_title: str
    company: str
    resume_name: str
    resume_text: str
    target_job: str
    target_profile: TargetProfileInput
    resume_analysis: ResumeAnalysisResponse
    assessment_result: AssessmentResult


class SimulationDigestItem(BaseModel):
    session_id: str
    simulation_type: str
    overall_score: float
    summary: str
    created_at: str


class ApplicationPackage(BaseModel):
    application_id: str
    student_id: str
    job_id: str
    company_id: str | None = None
    job_title: str
    company: str
    status: str
    submitted_at: str
    resume_name: str
    resume_text: str
    resume_analysis: ResumeAnalysisResponse
    assessment_result: AssessmentResult
    simulation_digest: list[SimulationDigestItem]


class ApplicationSubmitResponse(BaseModel):
    student_id: str
    application: StudentApplicationItem
    package: ApplicationPackage
