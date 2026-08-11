from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import AbilityDimension, AgentReview
from app.schemas.simulations import EpisodeEnding


class SimulationAutoRunRequest(BaseModel):
    student_id: str = "stu_001"
    resume_content: str
    target_job: str
    simulation_type: Literal["growth", "job"] = "job"
    player_strategy: Literal["conservative", "aggressive", "random"] = "conservative"
    max_turns: int = Field(default=12, ge=1, le=20)


class SimulationAutoRunResponse(BaseModel):
    episode_id: str
    overall_score: float
    ability_scores: list[AbilityDimension]
    agent_reviews: list[AgentReview]
    weak_dimensions: list[str] = Field(default_factory=list)
    suggested_resume_modifications: list[str] = Field(default_factory=list)
    ending: EpisodeEnding | None = None
    engine: str = "mock"
    turns_played: int = 0


class ResumeOptimizeIteration(BaseModel):
    iteration: int
    overall_score: float
    weak_dimensions: list[str] = Field(default_factory=list)
    resume_preview: str = ""


class ResumeOptimizeRequest(BaseModel):
    student_id: str = "stu_001"
    original_resume: str
    target_job: str
    iterations: int = Field(default=3, ge=1, le=8)
    player_strategy: Literal["conservative", "aggressive", "random"] = "conservative"
    score_target: float = Field(default=85, ge=60, le=100)


class ResumeOptimizeResponse(BaseModel):
    optimized_resume: str
    original_score: float
    final_score: float
    improvement_history: list[ResumeOptimizeIteration]
    modification_log: list[str] = Field(default_factory=list)
    suggested_resume_modifications: list[str] = Field(default_factory=list)
    engine: str = "mock"
    reasoning_trace: list[str] = Field(default_factory=list)
