from pydantic import BaseModel


class TransformationProjectItem(BaseModel):
    id: str
    creatorId: str
    creatorRole: str
    projectType: str
    title: str
    description: str
    domain: str
    maturityLevel: str | None = None
    budgetRange: str | None = None
    cooperationMode: str | None = None
    requiredAbilities: list[str]
    status: str
    contactName: str
    contactEmail: str
    contactPhone: str | None = None
    createdAt: str
    updatedAt: str


class TransformationProjectsResponse(BaseModel):
    projects: list[TransformationProjectItem]
    total: int


class TransformationProjectDetailResponse(BaseModel):
    project: TransformationProjectItem
    application_count: int
    accepted_count: int


class TransformationApplicationItem(BaseModel):
    id: str
    projectId: str
    applicantId: str
    applicantRole: str
    status: str
    message: str | None = None
    abilities: list[str]
    createdAt: str
    updatedAt: str


class TransformationApplicationsResponse(BaseModel):
    applications: list[TransformationApplicationItem]


class TransformationPublishRequest(BaseModel):
    creatorId: str
    creatorRole: str
    projectType: str
    title: str
    description: str
    domain: str
    maturityLevel: str | None = None
    budgetRange: str | None = None
    cooperationMode: str | None = None
    requiredAbilities: list[str] = []
    contactName: str
    contactEmail: str
    contactPhone: str | None = None


class TransformationPublishResponse(BaseModel):
    project_id: str
    title: str
    saved: bool
    created_at: str


class TransformationApplyRequest(BaseModel):
    projectId: str
    applicantId: str
    applicantRole: str
    message: str | None = None
    abilities: list[str] = []


class TransformationApplyResponse(BaseModel):
    application_id: str
    project_id: str
    status: str
    saved: bool
    created_at: str


class TransformationStatsResponse(BaseModel):
    total_projects: int
    open_projects: int
    matched_projects: int
    total_applications: int
    accepted_applications: int


class TransformationDashboardResponse(BaseModel):
    metrics: list[dict]
    projects: list[TransformationProjectItem]
