from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.simulations import RecalledMemory, SimulationEpisode


class AgentStartRequest(BaseModel):
    student_id: str
    simulation_type: Literal["growth", "job"]
    target: str


class AgentActRequest(BaseModel):
    episode_id: str
    choice: str


class AgentStepResult(BaseModel):
    episode: SimulationEpisode
    finished: bool
    ending_triggered: bool
    reasoning_trace: list[str] = Field(default_factory=list)
    recalled_memories: list[RecalledMemory] = Field(default_factory=list)
    engine: str = "mock"


class AgentErrorBody(BaseModel):
    error: str
    code: str = "REACT_FAILED"
    retryable: bool = False
    correlation_id: str | None = None


class AgentSseTraceEvent(BaseModel):
    line: str


class AgentStatePayload(BaseModel):
    """camelCase episode agent state (matches Next.js EpisodeAgentState)."""

    episode_id: str = Field(alias="episodeId")
    student_id: str = Field(alias="studentId")
    simulation_type: str = Field(alias="simulationType")
    target: str
    current_stage: int = Field(alias="currentStage")
    total_stages_dynamic: int = Field(alias="totalStagesDynamic")
    status: Literal["running", "completed"]
    state: dict[str, int]
    current_event: dict[str, Any] | None = Field(default=None, alias="currentEvent")
    dialogue: list[dict[str, str]] = Field(default_factory=list)
    turns: list[dict[str, Any]] = Field(default_factory=list)
    ending: dict[str, Any] | None = None
    ending_type: str | None = Field(default=None, alias="endingType")
    event_history: list[str] = Field(default_factory=list, alias="eventHistory")
    player_choices: list[str] = Field(default_factory=list, alias="playerChoices")
    long_term_memories: list[dict[str, Any]] = Field(default_factory=list, alias="longTermMemories")
    recalled_memories: list[dict[str, Any]] = Field(default_factory=list, alias="recalledMemories")
    reasoning_trace: list[str] = Field(default_factory=list, alias="reasoningTrace")
    engine: str = "mock"
    phase_complete: bool = Field(default=False, alias="phaseComplete")
    last_turn_score: float | None = Field(default=None, alias="lastTurnScore")
    last_player_choice: str | None = Field(default=None, alias="lastPlayerChoice")

    model_config = {"populate_by_name": True}
