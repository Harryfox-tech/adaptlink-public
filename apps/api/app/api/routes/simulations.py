from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.api.deps.student_auth import assert_student_access, require_student
from app.schemas.auth import AuthUser
from app.schemas.simulation_agent import AgentActRequest, AgentStartRequest, AgentStepResult

from app.schemas.simulations import (
    EpisodeActionRequest,
    EpisodeActionResponse,
    EpisodeDialogueRequest,
    EpisodeDialogueResponse,
    EpisodePersistRequest,
    EpisodeStartRequest,
    LifeMemoryListResponse,
    LifeMemoryItem,
    MemoryCreateRequest,
    MemoryCreateResponse,
    SimulationAggregate,
    SimulationEpisode,
    SimulationHistoryResponse,
    SimulationStartRequest,
    SimulationStartResponse,
)
from app.services.ending_engine import evaluate_ending
from app.services.memory_service import delete_memory, get_memory_student_id, list_memories, retrieve_relevant_memories, store_memory
from app.services.simulation_episode_service import (
    act_episode,
    get_episode,
    persist_agent_episode,
    start_episode,
    talk_episode,
)
from app.schemas.agent_state import (
    AgentStateDeleteResponse,
    AgentStateResponse,
    AgentStateUpsertRequest,
)
from app.schemas.resume_optimizer import SimulationAutoRunRequest, SimulationAutoRunResponse
from app.services.agent_state_service import delete_agent_state, load_agent_state, save_agent_state
from app.services.simulation_agent_service import run_agent_act, run_agent_act_stream, run_agent_start, run_agent_start_stream
from app.services.simulation_auto_run_service import run_auto_simulation, run_auto_simulation_stream
from app.services.simulation_service import get_latest_simulation, get_simulation_history, run_simulation_and_persist

router = APIRouter()


def _agent_step_to_camel(result: AgentStepResult) -> dict:
    from app.services.simulation_agent_tools import episode_to_frontend_dict

    return {
        "episode": episode_to_frontend_dict(result.episode),
        "finished": result.finished,
        "endingTriggered": result.ending_triggered,
        "reasoningTrace": result.reasoning_trace,
        "recalledMemories": [
            {"memoryId": m.memory_id, "text": m.text, "reflectedInStory": m.reflected_in_story}
            for m in result.recalled_memories
        ],
        "engine": result.engine,
    }


@router.post("/agent/start")
def simulation_agent_start(payload: AgentStartRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, payload.student_id)
    try:
        result = run_agent_start(payload.student_id, payload.simulation_type, payload.target)
        return _agent_step_to_camel(result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/agent/act")
def simulation_agent_act(payload: AgentActRequest):
    try:
        result = run_agent_act(payload.episode_id, payload.choice)
        return _agent_step_to_camel(result)
    except ValueError as exc:
        msg = str(exc)
        status = 404 if "not found" in msg.lower() else 409 if "completed" in msg.lower() else 400
        raise HTTPException(status_code=status, detail=msg) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/agent/start/stream")
def simulation_agent_start_stream(payload: AgentStartRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, payload.student_id)
    return StreamingResponse(
        run_agent_start_stream(payload.student_id, payload.simulation_type, payload.target),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.post("/agent/act/stream")
def simulation_agent_act_stream(payload: AgentActRequest):
    return StreamingResponse(
        run_agent_act_stream(payload.episode_id, payload.choice),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.put("/agent-state", response_model=AgentStateResponse)
def upsert_agent_state(payload: AgentStateUpsertRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, payload.student_id)
    saved, _reason = save_agent_state(
        episode_id=payload.episode_id,
        student_id=payload.student_id,
        agent_type=payload.agent_type,
        state=payload.state,
    )
    return AgentStateResponse(
        episode_id=payload.episode_id,
        student_id=payload.student_id,
        agent_type=payload.agent_type,
        state=payload.state,
        persisted=saved,
    )


@router.get("/agent-state/{episode_id}", response_model=AgentStateResponse)
def get_agent_state(episode_id: str):
    row = load_agent_state(episode_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Agent state not found")
    return AgentStateResponse(
        episode_id=row["episode_id"],
        student_id=row["student_id"],
        agent_type=row["agent_type"],
        state=row["state"],
        updated_at=row.get("updated_at"),
        persisted=True,
    )


@router.delete("/agent-state/{episode_id}", response_model=AgentStateDeleteResponse)
def remove_agent_state(episode_id: str):
    deleted = delete_agent_state(episode_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Agent state not found")
    return AgentStateDeleteResponse(ok=True, episode_id=episode_id, deleted=True)


@router.post("/auto-run", response_model=SimulationAutoRunResponse)
def simulation_auto_run(payload: SimulationAutoRunRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, payload.student_id)
    return run_auto_simulation(payload)


@router.post("/auto-run/stream")
def simulation_auto_run_stream(payload: SimulationAutoRunRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, payload.student_id)
    return StreamingResponse(
        run_auto_simulation_stream(payload),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.post("/run", response_model=SimulationStartResponse)
def run_simulation(payload: SimulationStartRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, payload.student_id)
    aggregate, engine, fallback_reason = run_simulation_and_persist(payload)
    return SimulationStartResponse(
        session_id=aggregate.session_id,
        status="completed",
        aggregate=aggregate,
        engine=engine,
        fallback_reason=fallback_reason,
    )


@router.post("/episode/start", response_model=SimulationEpisode)
def simulation_episode_start(payload: EpisodeStartRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, payload.student_id)
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


@router.post("/episode/persist")
def simulation_episode_persist(payload: EpisodePersistRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, payload.episode.student_id)
    persist_agent_episode(
        payload.episode,
        ending_type=payload.ending_type,
        agent_trace=payload.agent_trace,
    )
    return {"ok": True, "episode_id": payload.episode.episode_id}


@router.post("/episode/check-ending")
def simulation_check_ending(episode: SimulationEpisode):
    result = evaluate_ending(episode)
    return {
        "triggered": result.triggered,
        "ending_type": result.ending_type,
        "ending": result.ending.model_dump() if result.ending else None,
    }


@router.get("/memories", response_model=LifeMemoryListResponse)
def get_student_memories(
    student_id: str = Query(..., description="Student id"),
    limit: int = Query(default=20, ge=1, le=100),
    user: AuthUser = Depends(require_student),
):
    assert_student_access(user, student_id)
    rows = list_memories(student_id=student_id, limit=limit)
    return LifeMemoryListResponse(
        student_id=student_id,
        items=[
            LifeMemoryItem(
                memory_id=r["memory_id"],
                memory_text=r["memory_text"],
                keywords=r.get("keywords") or [],
                importance=r.get("importance") or 5,
                episode_id=r.get("episode_id"),
                created_at=r.get("created_at"),
            )
            for r in rows
        ],
    )


@router.get("/memories/recall")
def recall_memories(
    student_id: str = Query(...),
    limit: int = Query(default=3, ge=1, le=10),
    context: str | None = Query(default=None),
    user: AuthUser = Depends(require_student),
):
    assert_student_access(user, student_id)
    memories = retrieve_relevant_memories(student_id=student_id, limit=limit, context=context)
    return {"student_id": student_id, "items": [m.model_dump() for m in memories]}


@router.post("/memories", response_model=MemoryCreateResponse)
def create_memory(payload: MemoryCreateRequest, user: AuthUser = Depends(require_student)):
    assert_student_access(user, payload.student_id)
    memory_id = store_memory(
        student_id=payload.student_id,
        memory_text=payload.memory_text,
        keywords=payload.keywords,
        importance=payload.importance,
        episode_id=payload.episode_id,
    )
    return MemoryCreateResponse(memory_id=memory_id)


@router.delete("/memories/{memory_id}")
def remove_memory(memory_id: str, user: AuthUser = Depends(require_student)):
    owner = get_memory_student_id(memory_id)
    if owner is None:
        raise HTTPException(status_code=404, detail="Memory not found")
    assert_student_access(user, owner)
    if not delete_memory(memory_id):
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"ok": True}


@router.get("/{simulation_type}/latest", response_model=SimulationAggregate)
def latest_simulation(
    simulation_type: Literal["growth", "job"],
    student_id: str = Query(..., description="Student id"),
    user: AuthUser = Depends(require_student),
):
    assert_student_access(user, student_id)
    aggregate = get_latest_simulation(student_id=student_id, simulation_type=simulation_type)
    if aggregate is None:
        raise HTTPException(status_code=404, detail="暂无模拟记录")
    return aggregate


@router.get("/history", response_model=SimulationHistoryResponse)
def simulation_history(
    student_id: str = Query(..., description="Student id"),
    limit: int = Query(default=20, ge=1, le=100),
    user: AuthUser = Depends(require_student),
):
    assert_student_access(user, student_id)
    return get_simulation_history(student_id=student_id, limit=limit)
