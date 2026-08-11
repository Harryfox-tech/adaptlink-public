from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


AgentType = Literal["storyline", "resume_optimizer"]


class AgentStateUpsertRequest(BaseModel):
    episode_id: str
    student_id: str
    agent_type: AgentType = "storyline"
    state: dict[str, Any] = Field(default_factory=dict)


class AgentStateResponse(BaseModel):
    episode_id: str
    student_id: str
    agent_type: AgentType
    state: dict[str, Any]
    updated_at: str | None = None
    persisted: bool = True


class AgentStateDeleteResponse(BaseModel):
    ok: bool
    episode_id: str
    deleted: bool
