from pydantic import BaseModel


class AchievementItem(BaseModel):
    id: str
    creatorId: str
    creatorRole: str

    # 基本信息
    title: str
    abstract: str
    achievementType: str          # 专利/软件著作权/学术论文/技术原型/算法模型/工艺方法/设备装置
    domain: str
    keywords: list[str]
    applicationScenario: str | None = None

    # 知识产权
    ipStatus: str                 # 已授权/申请中/无专利/软件著作权/开源
    patentNumbers: list[str]
    patentType: str | None = None # 发明专利/实用新型/外观设计
    publicationLink: str | None = None

    # 技术成熟度
    trlLevel: int | None = None   # 1-9
    maturityDesc: str | None = None

    # 转化信息
    cooperationMode: str
    budgetRange: str | None = None
    transformationStage: str      # published/negotiating/contracted/deployed/completed

    # 团队/机构
    teamName: str | None = None
    institutionName: str
    contactName: str
    contactEmail: str
    contactPhone: str | None = None

    # TAI 挂接
    requiredAbilities: list[str]

    status: str                   # active/archived
    viewCount: int
    createdAt: str
    updatedAt: str


class AchievementsResponse(BaseModel):
    achievements: list[AchievementItem]
    total: int


class AchievementDetailResponse(BaseModel):
    achievement: AchievementItem
    application_count: int


class AchievementPublishRequest(BaseModel):
    creatorId: str
    creatorRole: str
    title: str
    abstract: str
    achievementType: str
    domain: str
    keywords: list[str] = []
    applicationScenario: str | None = None
    ipStatus: str
    patentNumbers: list[str] = []
    patentType: str | None = None
    publicationLink: str | None = None
    trlLevel: int | None = None
    maturityDesc: str | None = None
    cooperationMode: str
    budgetRange: str | None = None
    teamName: str | None = None
    institutionName: str
    contactName: str
    contactEmail: str
    contactPhone: str | None = None
    requiredAbilities: list[str] = []


class AchievementPublishResponse(BaseModel):
    achievement_id: str
    title: str
    saved: bool
    created_at: str


class AchievementStageUpdateRequest(BaseModel):
    stage: str  # published/negotiating/contracted/deployed/completed


class AchievementStatsResponse(BaseModel):
    total: int
    by_type: list[dict]       # [{type, count}]
    by_domain: list[dict]     # [{domain, count}]
    by_trl: list[dict]        # [{trl, count}]
    by_stage: list[dict]      # [{stage, count}]
    by_ip_status: list[dict]  # [{status, count}]
