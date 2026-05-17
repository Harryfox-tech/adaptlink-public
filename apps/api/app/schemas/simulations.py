from pydantic import BaseModel, Field
from typing import Literal

from app.schemas.common import AbilityDimension, AgentReview, SimulationMessage


class SimulationStartRequest(BaseModel):
    student_id: str
    simulation_type: Literal["growth", "job"]
    scene: str
    target_job: str | None = None
    messages: list[SimulationMessage] = Field(default_factory=list)


class JobRecommendation(BaseModel):
    job_id: str
    title: str
    company: str
    match_score: float = Field(..., ge=0, le=100)
    reasons: list[str] = Field(default_factory=list)


class SimulationAggregate(BaseModel):
    session_id: str
    simulation_type: Literal["growth", "job"]
    overall_score: float = Field(..., ge=0, le=100)
    summary: str
    recommendations: list[str]
    ability_scores: list[AbilityDimension]
    agent_reviews: list[AgentReview]
    job_recommendations: list[JobRecommendation] = Field(default_factory=list)


class SimulationStartResponse(BaseModel):
    session_id: str
    status: Literal["running", "completed"]
    aggregate: SimulationAggregate
    engine: str = "mock"
    fallback_reason: str | None = None


class SimulationHistoryItem(BaseModel):
    session_id: str
    simulation_type: Literal["growth", "job"]
    scene: str
    overall_score: float
    summary: str
    created_at: str


class SimulationHistoryResponse(BaseModel):
    student_id: str
    items: list[SimulationHistoryItem]


class EpisodeState(BaseModel):
    confidence: int = Field(..., ge=0, le=100)
    pressure: int = Field(..., ge=0, le=100)
    energy: int = Field(..., ge=0, le=100)
    readiness: int = Field(..., ge=0, le=100)


class EpisodeEvent(BaseModel):
    id: str
    stage: int
    title: str
    description: str
    choices: list[str]
    npc_role: str
    npc_goal: str
    opening_line: str


class EpisodeDialogueMessage(BaseModel):
    speaker: Literal["user", "npc"]
    content: str
    timestamp: str


class EpisodeTurnResult(BaseModel):
    turn: int
    choice: str
    aggregate: SimulationAggregate
    state_after: EpisodeState
    narrative: str
    engine: str = "mock"
    fallback_reason: str | None = None


class EpisodeEnding(BaseModel):
    code: str
    title: str
    summary: str
    next_steps: list[str]


class SimulationEpisode(BaseModel):
    episode_id: str
    student_id: str
    simulation_type: Literal["growth", "job"]
    target: str
    total_stages: int
    current_stage: int
    status: Literal["running", "completed"]
    state: EpisodeState
    current_event: EpisodeEvent | None = None
    dialogue: list[EpisodeDialogueMessage] = Field(default_factory=list)
    turns: list[EpisodeTurnResult] = Field(default_factory=list)
    ending: EpisodeEnding | None = None


class EpisodeStartRequest(BaseModel):
    student_id: str
    simulation_type: Literal["growth", "job"]
    target: str
    seed: int | None = None


class EpisodeActionRequest(BaseModel):
    choice: str | None = None
    user_response: str | None = None


class EpisodeActionResponse(BaseModel):
    episode: SimulationEpisode
    finished: bool


class EpisodeDialogueRequest(BaseModel):
    message: str


class EpisodeDialogueResponse(BaseModel):
    episode_id: str
    npc_role: str
    reply: str
    dialogue: list[EpisodeDialogueMessage]
