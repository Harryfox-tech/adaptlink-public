from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal, List


class AbilityDimension(BaseModel):
    key: str
    label: str
    score: float = Field(..., ge=0, le=100)
    trend: Literal["up", "flat", "down"] = "flat"


class AgentReview(BaseModel):
    agent: str
    score: float = Field(..., ge=0, le=100)
    summary: str
    highlights: List[str] = []


class SimulationMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
