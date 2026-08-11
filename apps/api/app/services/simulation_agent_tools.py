from __future__ import annotations

import json
import random
from datetime import datetime, timezone
from typing import Any, Callable
from uuid import uuid4

from langchain_core.tools import StructuredTool

from app.schemas.common import SimulationMessage
from app.schemas.simulations import (
    EpisodeDialogueMessage,
    EpisodeEvent,
    EpisodeState,
    EpisodeTurnResult,
    SimulationAggregate,
    SimulationEpisode,
    SimulationStartRequest,
)
from app.services.agent_llm_service import llm_generate_json, should_try_real_llm
from app.services.ending_engine import evaluate_ending
from app.services.memory_service import retrieve_relevant_memories, store_memory
from app.services.simulation_episode_service import persist_agent_episode
from app.services.simulation_service import run_simulation_and_persist


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clamp(n: float) -> int:
    return max(0, min(100, round(n)))


def _tool_obs(data: dict[str, Any]) -> str:
    if data.get("ok") is False:
        return json.dumps(
            {
                "ok": False,
                "errorCode": data.get("errorCode", "TOOL_ERROR"),
                "error": data.get("error", "unknown"),
                "retryable": data.get("retryable", True),
                **{k: v for k, v in data.items() if k not in ("ok", "errorCode", "error", "retryable")},
            },
            ensure_ascii=False,
        )
    return json.dumps({"ok": True, **{k: v for k, v in data.items() if k != "ok"}}, ensure_ascii=False)


def new_episode_state(student_id: str, simulation_type: str, target: str, correlation_id: str) -> dict[str, Any]:
    total = 4 + random.randint(0, 1)
    return {
        "episodeId": f"ep_agent_{simulation_type}_{uuid4().hex[:10]}",
        "studentId": student_id,
        "simulationType": simulation_type,
        "target": target,
        "currentStage": 1,
        "totalStagesDynamic": total,
        "status": "running",
        "state": {"confidence": 55, "pressure": 45, "energy": 70, "readiness": 50},
        "currentEvent": None,
        "dialogue": [],
        "turns": [],
        "ending": None,
        "endingType": None,
        "eventHistory": [],
        "playerChoices": [],
        "longTermMemories": [],
        "recalledMemories": [],
        "reasoningTrace": [f"[ReAct/LangGraph] 启动导演 Agent ({correlation_id})"],
        "engine": "mock",
        "phaseComplete": False,
        "lastTurnScore": None,
        "lastPlayerChoice": None,
    }


def state_to_simulation_episode(state: dict[str, Any]) -> SimulationEpisode:
    st = state.get("state") or {}
    current = state.get("currentEvent")
    ending = state.get("ending")
    turns_raw = state.get("turns") or []
    turns: list[EpisodeTurnResult] = []
    for t in turns_raw:
        agg = t.get("aggregate") or {}
        ability_raw = agg.get("abilityScores") or agg.get("ability_scores") or []
        reviews_raw = agg.get("agentReviews") or agg.get("agent_reviews") or []
        jobs_raw = agg.get("jobMatches") or agg.get("job_recommendations") or []
        aggregate = SimulationAggregate(
            session_id=agg.get("sessionId") or agg.get("session_id") or "",
            simulation_type=agg.get("simulationType") or agg.get("simulation_type") or state["simulationType"],
            overall_score=float(agg.get("overallScore") or agg.get("overall_score") or 0),
            summary=agg.get("summary") or "",
            recommendations=agg.get("recommendations") or [],
            ability_scores=[
                {
                    "key": a.get("key", ""),
                    "label": a.get("label", ""),
                    "score": a.get("score", 0),
                    "trend": a.get("trend", "flat"),
                }
                for a in ability_raw
            ],
            agent_reviews=[
                {
                    "agent": r.get("agent", ""),
                    "score": r.get("score", 0),
                    "summary": r.get("summary", ""),
                    "highlights": r.get("highlights") or [],
                }
                for r in reviews_raw
            ],
            job_recommendations=[
                {
                    "job_id": j.get("jobId") or j.get("job_id") or "",
                    "title": j.get("title", ""),
                    "company": j.get("company", ""),
                    "match_score": j.get("matchScore") or j.get("match_score") or 0,
                    "reasons": j.get("reasons") or [],
                }
                for j in jobs_raw
            ],
        )
        turns.append(
            EpisodeTurnResult(
                turn=t.get("turn", 0),
                choice=t.get("choice", ""),
                aggregate=aggregate,
                state_after=EpisodeState(**(t.get("stateAfter") or t.get("state_after") or st)),
                narrative=t.get("narrative") or "",
                engine=t.get("engine") or state.get("engine", "mock"),
            )
        )

    event = None
    if current:
        event = EpisodeEvent(
            id=current.get("id", ""),
            stage=current.get("stage", state.get("currentStage", 1)),
            title=current.get("title", ""),
            description=current.get("description", ""),
            choices=current.get("choices") or [],
            npc_role=current.get("npcRole") or current.get("npc_role") or "",
            npc_goal=current.get("npcGoal") or current.get("npc_goal") or "",
            opening_line=current.get("openingLine") or current.get("opening_line") or "",
        )

    from app.schemas.simulations import EpisodeEnding, RecalledMemory

    ending_obj = None
    if ending:
        ending_obj = EpisodeEnding(
            code=ending.get("code", ""),
            title=ending.get("title", ""),
            summary=ending.get("summary", ""),
            next_steps=ending.get("nextSteps") or ending.get("next_steps") or [],
        )

    recalled = [
        RecalledMemory(
            memory_id=m.get("memoryId") or m.get("memory_id") or "",
            text=m.get("text") or m.get("memory_text") or "",
            reflected_in_story=bool(m.get("reflectedInStory") or m.get("reflected_in_story")),
        )
        for m in (state.get("recalledMemories") or [])
    ]

    return SimulationEpisode(
        episode_id=state["episodeId"],
        student_id=state["studentId"],
        simulation_type=state["simulationType"],
        target=state["target"],
        total_stages=state.get("totalStagesDynamic") or 4,
        current_stage=state.get("currentStage") or 1,
        status=state.get("status") or "running",
        state=EpisodeState(**st),
        current_event=event,
        dialogue=[
            EpisodeDialogueMessage(
                speaker=d.get("speaker", "npc"),
                content=d.get("content", ""),
                timestamp=d.get("timestamp", _now_iso()),
            )
            for d in (state.get("dialogue") or [])
        ],
        turns=turns,
        ending=ending_obj,
        recalled_memories=recalled,
        ending_type=state.get("endingType"),
        total_stages_dynamic=state.get("totalStagesDynamic"),
        reasoning_trace=state.get("reasoningTrace") or [],
    )


def episode_to_frontend_dict(episode: SimulationEpisode) -> dict[str, Any]:
    """Convert SimulationEpisode to camelCase dict for frontend."""
    ce = episode.current_event
    return {
        "episodeId": episode.episode_id,
        "studentId": episode.student_id,
        "simulationType": episode.simulation_type,
        "target": episode.target,
        "totalStages": episode.total_stages,
        "currentStage": episode.current_stage,
        "status": episode.status,
        "state": episode.state.model_dump(),
        "currentEvent": (
            {
                "id": ce.id,
                "stage": ce.stage,
                "title": ce.title,
                "description": ce.description,
                "choices": ce.choices,
                "npcRole": ce.npc_role,
                "npcGoal": ce.npc_goal,
                "openingLine": ce.opening_line,
            }
            if ce
            else None
        ),
        "dialogue": [d.model_dump(by_alias=False) for d in episode.dialogue],
        "turns": [
            {
                "turn": t.turn,
                "choice": t.choice,
                "aggregate": {
                    "sessionId": t.aggregate.session_id,
                    "simulationType": t.aggregate.simulation_type,
                    "overallScore": t.aggregate.overall_score,
                    "summary": t.aggregate.summary,
                    "recommendations": t.aggregate.recommendations,
                    "abilityScores": [a.model_dump() for a in t.aggregate.ability_scores],
                    "agentReviews": [r.model_dump() for r in t.aggregate.agent_reviews],
                    "jobMatches": [
                        {
                            "jobId": j.job_id,
                            "title": j.title,
                            "company": j.company,
                            "matchScore": j.match_score,
                            "reasons": j.reasons,
                        }
                        for j in t.aggregate.job_recommendations
                    ],
                },
                "stateAfter": t.state_after.model_dump(),
                "narrative": t.narrative,
                "engine": t.engine,
            }
            for t in episode.turns
        ],
        "ending": (
            {
                "code": episode.ending.code,
                "title": episode.ending.title,
                "summary": episode.ending.summary,
                "nextSteps": episode.ending.next_steps,
            }
            if episode.ending
            else None
        ),
        "recalledMemories": [
            {"memoryId": m.memory_id, "text": m.text, "reflectedInStory": m.reflected_in_story}
            for m in episode.recalled_memories
        ],
        "endingType": episode.ending_type,
        "totalStagesDynamic": episode.total_stages_dynamic,
        "reasoningTrace": episode.reasoning_trace,
    }


def _retrieve_memories(state: dict[str, Any]) -> str:
    try:
        items = retrieve_relevant_memories(
            student_id=state["studentId"],
            limit=3,
            context=state.get("target"),
        )
        recalled = [
            {"memoryId": m.memory_id, "text": m.text, "reflectedInStory": False}
            for m in items
        ]
        state["recalledMemories"] = recalled
        state["longTermMemories"] = recalled
        return _tool_obs({"count": len(recalled), "memories": [m["text"] for m in recalled]})
    except Exception as exc:  # noqa: BLE001
        state["reasoningTrace"].append(f"[warn] retrieveMemories: {exc}")
        fallback = [
            {
                "memoryId": f"local_{state['studentId']}",
                "text": "你曾在团队协作中展现过主动担责的一面。",
                "reflectedInStory": False,
            }
        ]
        state["recalledMemories"] = fallback
        state["longTermMemories"] = fallback
        return _tool_obs({"mock": True, "count": 1, "memories": [fallback[0]["text"]]})


def _generate_event(state: dict[str, Any], narrative_focus: str = "") -> str:
    memory_hint = "；".join(m.get("text", "") for m in (state.get("recalledMemories") or []))
    sim_type = state["simulationType"]
    stage = state.get("currentStage", 1)
    total = state.get("totalStagesDynamic", 4)
    st = state.get("state") or {}

    if should_try_real_llm():
        data, err = llm_generate_json(
            "你是剧情导演。输出 JSON：title, description, choices(2-5项), npc_role, npc_goal, opening_line",
            f"类型:{sim_type} 目标:{state['target']} 幕:{stage}/{total} 状态:{json.dumps(st)} "
            f"记忆:{memory_hint} 重点:{narrative_focus}",
            temperature=0.7,
        )
        if data and data.get("title"):
            event = {
                "id": f"ev_{state['episodeId']}_{stage}",
                "stage": stage,
                "title": data["title"],
                "description": data.get("description", ""),
                "choices": data.get("choices") or ["继续推进", "暂缓观察"],
                "npcRole": data.get("npc_role") or ("面试官" if sim_type == "job" else "导师"),
                "npcGoal": data.get("npc_goal") or "检验表达与抗压",
                "openingLine": data.get("opening_line") or data["title"],
            }
            state["currentEvent"] = event
            state.setdefault("eventHistory", []).append(event["title"])
            state["dialogue"] = [{"speaker": "npc", "content": event["openingLine"], "timestamp": _now_iso()}]
            state["recalledMemories"] = [
                {**m, "reflectedInStory": True} for m in (state.get("recalledMemories") or [])
            ]
            state["engine"] = "openai"
            return _tool_obs(
                {
                    "eventTitle": event["title"],
                    "choices": event["choices"],
                    "openingLine": event["openingLine"],
                }
            )
        if err:
            state["reasoningTrace"].append(f"generateEvent llm error: {err}")

    titles = (
        ["压力追问", "业务案例深挖", "团队协作冲突", "终面复盘"]
        if sim_type == "job"
        else ["资源冲突", "团队分歧", "进度失控", "成果答辩"]
    )
    title = titles[min(stage - 1, len(titles) - 1)]
    event = {
        "id": f"ev_{state['episodeId']}_{stage}",
        "stage": stage,
        "title": title,
        "description": f"第 {stage} 幕：围绕目标出现新局面。",
        "choices": ["先澄清目标与边界", "主动承担并给出方案", "寻求同伴支持后推进", "暂缓并收集更多信息"],
        "npcRole": "面试官" if sim_type == "job" else "导师",
        "npcGoal": "检验结构化表达与抗压",
        "openingLine": f"面对「{title}」，你的第一步是什么？",
    }
    state["currentEvent"] = event
    state.setdefault("eventHistory", []).append(title)
    state["dialogue"] = [{"speaker": "npc", "content": event["openingLine"], "timestamp": _now_iso()}]
    state["engine"] = "mock"
    return _tool_obs({"mock": True, "eventTitle": title, "choices": event["choices"]})


def _evaluate_player_choice(state: dict[str, Any], choice: str) -> str:
    state["lastPlayerChoice"] = choice
    current = state.get("currentEvent")
    scene = f"{current['title']} | {current['description']}" if current else state["target"]
    payload = SimulationStartRequest(
        student_id=state["studentId"],
        simulation_type=state["simulationType"],
        scene=scene,
        target_job=state["target"] if state["simulationType"] == "job" else None,
        messages=[SimulationMessage(role="user", content=choice)],
    )
    try:
        aggregate, engine, _ = run_simulation_and_persist(payload)
        score = aggregate.overall_score
        if engine == "openai":
            state["engine"] = "openai"
    except Exception as exc:  # noqa: BLE001
        state["reasoningTrace"].append(f"[warn] evaluatePlayerChoice: {exc}")
        score = 72.0
        aggregate = None
        engine = "mock"

    if aggregate is None:
        weak: list[str] = []
        summary = "Mock 评估"
        ability_scores: list[dict] = []
        agent_reviews: list[dict] = []
        job_matches: list[dict] = []
        session_id = f"mock_{int(datetime.now().timestamp())}"
    else:
        weak = [a.label for a in aggregate.ability_scores if a.score < 72]
        summary = aggregate.summary
        ability_scores = [a.model_dump() for a in aggregate.ability_scores]
        agent_reviews = [r.model_dump() for r in aggregate.agent_reviews]
        job_matches = [
            {
                "jobId": j.job_id,
                "title": j.title,
                "company": j.company,
                "matchScore": j.match_score,
                "reasons": j.reasons,
            }
            for j in aggregate.job_recommendations
        ]
        session_id = aggregate.session_id

    delta = (score - 70) / 5
    st = state.get("state") or {}
    state["state"] = {
        "confidence": _clamp(st.get("confidence", 55) + delta + (2 if len(choice) > 40 else 0)),
        "pressure": _clamp(st.get("pressure", 45) - delta / 2 + (4 if score < 65 else -2)),
        "energy": _clamp(st.get("energy", 70) - 3),
        "readiness": _clamp(st.get("readiness", 50) + delta),
    }
    state["lastTurnScore"] = score
    state.setdefault("playerChoices", []).append(choice)
    state.setdefault("dialogue", []).append({"speaker": "user", "content": choice, "timestamp": _now_iso()})
    state.setdefault("turns", []).append(
        {
            "turn": len(state["turns"]) + 1,
            "choice": choice,
            "aggregate": {
                "sessionId": session_id,
                "simulationType": state["simulationType"],
                "overallScore": score,
                "summary": summary,
                "recommendations": aggregate.recommendations if aggregate else [],
                "abilityScores": ability_scores,
                "agentReviews": agent_reviews,
                "jobMatches": job_matches,
            },
            "stateAfter": dict(state["state"]),
            "narrative": f"第 {state.get('currentStage')} 幕：选择「{choice[:80]}」，得分 {score}",
            "engine": state.get("engine", "mock"),
        }
    )
    return _tool_obs(
        {
            "overallScore": score,
            "state": state["state"],
            "weakAbilities": weak,
            "summary": summary,
        }
    )


def _check_ending(state: dict[str, Any]) -> str:
    episode = state_to_simulation_episode(state)
    try:
        result = evaluate_ending(episode)
        if result.triggered and result.ending:
            state["status"] = "completed"
            state["currentEvent"] = None
            state["endingType"] = result.ending_type
            state["ending"] = {
                "code": result.ending.code,
                "title": result.ending.title,
                "summary": result.ending.summary,
                "nextSteps": result.ending.next_steps,
            }
            return _tool_obs(
                {
                    "triggered": True,
                    "endingType": result.ending_type,
                    "endingTitle": result.ending.title,
                    "endingSummary": result.ending.summary,
                }
            )
        return _tool_obs({"triggered": False, "reason": "条件未满足，可继续剧情"})
    except Exception as exc:  # noqa: BLE001
        state["reasoningTrace"].append(f"[warn] checkEnding: {exc}")
        if state.get("currentStage", 1) >= state.get("totalStagesDynamic", 4):
            state["status"] = "completed"
            state["endingType"] = "neutral"
            state["ending"] = {
                "code": "NEUTRAL_END",
                "title": "平稳收官",
                "summary": "完成剧情线。",
                "nextSteps": ["复盘", "再练一轮"],
            }
            state["currentEvent"] = None
            return _tool_obs({"triggered": True, "endingType": "neutral", "mock": True})
        return _tool_obs({"triggered": False})


def _advance_stage(state: dict[str, Any]) -> str:
    if state.get("status") == "completed":
        return _tool_obs(
            {
                "ok": False,
                "errorCode": "EPISODE_COMPLETED",
                "error": "episode already completed",
                "retryable": False,
            }
        )
    state["currentStage"] = state.get("currentStage", 1) + 1
    return _tool_obs(
        {
            "currentStage": state["currentStage"],
            "total": state.get("totalStagesDynamic", 4),
        }
    )


def _finalize_episode(state: dict[str, Any]) -> str:
    ending = state.get("ending")
    if ending:
        try:
            store_memory(
                student_id=state["studentId"],
                memory_text=ending.get("summary", ""),
                keywords=[state["simulationType"], state.get("endingType") or "end"],
                importance=8,
                episode_id=state["episodeId"],
            )
        except Exception:  # noqa: BLE001
            pass
    try:
        episode = state_to_simulation_episode(state)
        persist_agent_episode(episode, ending_type=state.get("endingType"), agent_trace=state.get("reasoningTrace"))
    except Exception:  # noqa: BLE001
        pass
    return _tool_obs({"status": state.get("status"), "ending": (ending or {}).get("title")})


def _wait_for_user_input(state: dict[str, Any], reason: str) -> str:
    state["phaseComplete"] = True
    return _tool_obs({"waiting": True, "reason": reason, "hasEvent": bool(state.get("currentEvent"))})


def create_simulation_tools(state: dict[str, Any]) -> list[StructuredTool]:
    return [
        StructuredTool.from_function(
            func=lambda: _retrieve_memories(state),
            name="retrieveMemories",
            description="从长期记忆库检索与本局相关的过往经历，供剧情引用",
        ),
        StructuredTool.from_function(
            func=lambda narrative_focus="": _generate_event(state, narrative_focus),
            name="generateEvent",
            description="生成当前幕的剧情事件（标题、描述、选项、NPC 开场白）",
        ),
        StructuredTool.from_function(
            func=lambda choice: _evaluate_player_choice(state, choice),
            name="evaluatePlayerChoice",
            description="评估玩家本轮选择，更新四维状态并记录回合结果",
        ),
        StructuredTool.from_function(
            func=lambda: _check_ending(state),
            name="checkEnding",
            description="检查是否满足动态结局条件",
        ),
        StructuredTool.from_function(
            func=lambda: _advance_stage(state),
            name="advanceStage",
            description="未结局时进入下一幕（仅调用一次）",
        ),
        StructuredTool.from_function(
            func=lambda: _finalize_episode(state),
            name="finalizeEpisode",
            description="结局已触发时：写入长期记忆并持久化 episode",
        ),
        StructuredTool.from_function(
            func=lambda reason: _wait_for_user_input(state, reason),
            name="waitForUserInput",
            description="本阶段 ReAct 结束，等待用户在 UI 操作（必须作为最后一步调用）",
        ),
    ]


def run_mock_react_fallback(
    state: dict[str, Any],
    phase: str,
    user_choice: str | None = None,
    on_trace: Callable[[str], None] | None = None,
) -> None:
    def trace(line: str) -> None:
        state.setdefault("reasoningTrace", []).append(line)
        if on_trace:
            on_trace(line)

    trace("[ReAct] Mock：未配置 OPENAI，使用规则择序 ReAct")

    if phase == "start":
        trace("[Action] retrieveMemories({})")
        trace(f"[Observation] retrieveMemories: {_retrieve_memories(state)[:120]}")
        trace("[Action] generateEvent({})")
        trace(f"[Observation] generateEvent: {_generate_event(state)[:120]}")
        trace('[Action] waitForUserInput({"reason":"mock-fallback"})')
        _wait_for_user_input(state, "mock-fallback")
        trace(f"[Observation] waitForUserInput: ok")
        return

    choice = (user_choice or "").strip() or "继续推进"
    trace(f'[Action] evaluatePlayerChoice({{"choice":"{choice[:40]}"}})')
    trace(f"[Observation] evaluatePlayerChoice: {_evaluate_player_choice(state, choice)[:120]}")
    trace("[Action] checkEnding({})")
    ending_obs = _check_ending(state)
    trace(f"[Observation] checkEnding: {ending_obs[:120]}")
    parsed = json.loads(ending_obs)
    if parsed.get("triggered"):
        trace("[Action] finalizeEpisode({})")
        trace(f"[Observation] finalizeEpisode: {_finalize_episode(state)[:120]}")
    else:
        trace("[Action] advanceStage({})")
        trace(f"[Observation] advanceStage: {_advance_stage(state)[:120]}")
        trace("[Action] generateEvent({})")
        trace(f"[Observation] generateEvent: {_generate_event(state)[:120]}")
    trace('[Action] waitForUserInput({"reason":"mock-fallback"})')
    _wait_for_user_input(state, "mock-fallback")
