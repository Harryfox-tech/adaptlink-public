from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.schemas.simulations import (
    EpisodeActionRequest,
    EpisodeActionResponse,
    EpisodeDialogueRequest,
    EpisodeDialogueResponse,
    EpisodeStartRequest,
    SimulationAggregate,
    SimulationEpisode,
    SimulationHistoryResponse,
    SimulationStartRequest,
    SimulationStartResponse,
)
from app.services.simulation_episode_service import act_episode, get_episode, start_episode, talk_episode
from app.services.simulation_service import get_latest_simulation, get_simulation_history, run_simulation_and_persist

router = APIRouter()


@router.post("/run", response_model=SimulationStartResponse)
def run_simulation(payload: SimulationStartRequest):
    aggregate, engine, fallback_reason = run_simulation_and_persist(payload)
    return SimulationStartResponse(
        session_id=aggregate.session_id,
        status="completed",
        aggregate=aggregate,
        engine=engine,
        fallback_reason=fallback_reason,
    )


@router.post("/episode/start", response_model=SimulationEpisode)
def simulation_episode_start(payload: EpisodeStartRequest):
    return start_episode(payload)


@router.get("/episode/{episode_id}", response_model=SimulationEpisode)
def simulation_episode_get(episode_id: str):
    episode = get_episode(episode_id)
    if episode is None:
        raise HTTPException(status_code=404, detail="Episode not found")
    return episode


@router.post("/episode/{episode_id}/action", response_model=EpisodeActionResponse)
def simulation_episode_action(episode_id: str, payload: EpisodeActionRequest):
    response = act_episode(episode_id, payload)
    if response is None:
        raise HTTPException(status_code=404, detail="Episode not found or already completed")
    return response


@router.post("/episode/{episode_id}/talk", response_model=EpisodeDialogueResponse)
def simulation_episode_talk(episode_id: str, payload: EpisodeDialogueRequest):
    response = talk_episode(episode_id, payload)
    if response is None:
        raise HTTPException(status_code=404, detail="Episode not found or already completed")
    return response


@router.get("/{simulation_type}/latest", response_model=SimulationAggregate)
def latest_simulation(
    simulation_type: Literal["growth", "job"],
    student_id: str = Query(..., description="Student id"),
):
    return get_latest_simulation(student_id=student_id, simulation_type=simulation_type)


@router.get("/history", response_model=SimulationHistoryResponse)
def simulation_history(
    student_id: str = Query(..., description="Student id"),
    limit: int = Query(default=20, ge=1, le=100),
):
    return get_simulation_history(student_id=student_id, limit=limit)
