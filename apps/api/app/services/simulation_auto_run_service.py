from __future__ import annotations

import json
import random
from collections.abc import Callable, Iterator
from typing import Any

from app.schemas.resume_optimizer import SimulationAutoRunRequest, SimulationAutoRunResponse
from app.schemas.simulations import EpisodeActionRequest, EpisodeStartRequest
from app.services.auto_player_service import choose_episode_option
from app.services.simulation_episode_service import act_episode, start_episode

WEAK_SCORE_THRESHOLD = 72


def _build_target(resume_content: str, target_job: str) -> str:
    preview = " ".join(resume_content.split())[:200]
    return (
        f"目标角色：{target_job}；"
        f"场景目标：在求职模拟中验证岗位匹配与表达能力；"
        f"优势证据：{preview or '具备基础实习与项目经历'}；"
        f"挑战边界：高压追问下结构化表达；"
        f"成功标准：获得稳定正向评估并明确改进点"
    )


def _weak_dimensions(ability_scores) -> list[str]:
    weak = [item.label for item in ability_scores if item.score < WEAK_SCORE_THRESHOLD]
    return weak[:5]


def _suggestions_from_reviews(weak: list[str], reviews, target_job: str) -> list[str]:
    tips: list[str] = []
    for label in weak[:3]:
        tips.append(f"针对「{label}」维度，在简历中补充与 {target_job} 相关的量化成果。")
    for review in reviews[:2]:
        for h in (review.highlights or [])[:1]:
            tips.append(f"延续优势：{h}")
    if not tips:
        tips.append("保持 STAR 结构，补充 1-2 条数据化结果。")
    return tips[:6]


def _emit(on_trace: Callable[[str], None] | None, line: str) -> None:
    if on_trace:
        on_trace(line)


def _emit_turn(on_turn: Callable[[dict[str, Any]], None] | None, payload: dict[str, Any]) -> None:
    if on_turn:
        on_turn(payload)


def _run_auto_simulation_core(
    payload: SimulationAutoRunRequest,
    *,
    on_trace: Callable[[str], None] | None = None,
    on_turn: Callable[[dict[str, Any]], None] | None = None,
) -> SimulationAutoRunResponse:
    rng = random.Random(hash((payload.student_id, payload.target_job, payload.resume_content[:80])) & 0xFFFFFFFF)
    target = _build_target(payload.resume_content, payload.target_job)

    _emit(on_trace, f"[AutoRun] 启动求职模拟 · 岗位 {payload.target_job} · 策略 {payload.player_strategy}")
    _emit_turn(
        on_turn,
        {
            "phase": "started",
            "turn": 0,
            "maxTurns": payload.max_turns,
            "targetJob": payload.target_job,
            "strategy": payload.player_strategy,
        },
    )

    episode = start_episode(
        EpisodeStartRequest(
            student_id=payload.student_id,
            simulation_type=payload.simulation_type,
            target=target,
            seed=rng.randint(1, 99999),
        )
    )

    engine = "mock"
    turns = 0

    while episode.status == "running" and episode.current_event and turns < payload.max_turns:
        event = episode.current_event
        turn_no = turns + 1
        _emit(on_trace, f"[AutoRun] 第 {turn_no}/{payload.max_turns} 幕 · {event.title}")
        _emit_turn(
            on_turn,
            {
                "phase": "turn_start",
                "turn": turn_no,
                "maxTurns": payload.max_turns,
                "eventTitle": event.title,
                "eventDescription": (event.description or "")[:240],
            },
        )

        choice, choice_engine = choose_episode_option(
            episode=episode,
            event=event,
            resume_context=payload.resume_content,
            target_job=payload.target_job,
            strategy=payload.player_strategy,
            rng=rng,
        )
        if choice_engine.startswith("openai"):
            engine = "openai"

        _emit(on_trace, f"[AutoRun] 自动选择：{choice}（引擎 {choice_engine}）")
        _emit_turn(
            on_turn,
            {
                "phase": "choice_made",
                "turn": turn_no,
                "maxTurns": payload.max_turns,
                "eventTitle": event.title,
                "choice": choice,
                "engine": choice_engine,
            },
        )

        response = act_episode(episode.episode_id, EpisodeActionRequest(choice=choice, user_response=choice))
        if response is None:
            _emit(on_trace, "[AutoRun] 回合执行失败，提前结束")
            break

        episode = response.episode
        turns += 1

        last_turn = episode.turns[-1] if episode.turns else None
        narrative = ""
        overall = 0.0
        if last_turn:
            narrative = (last_turn.narrative or "")[:280]
            overall = last_turn.aggregate.overall_score
            if last_turn.engine == "openai":
                engine = "openai"

        _emit(on_trace, f"[AutoRun] 第 {turn_no} 幕完成 · 当前总分 {overall:.1f}")
        if narrative:
            _emit(on_trace, f"[AutoRun] 剧情：{narrative}")

        _emit_turn(
            on_turn,
            {
                "phase": "turn_complete",
                "turn": turn_no,
                "maxTurns": payload.max_turns,
                "eventTitle": event.title,
                "choice": choice,
                "overallScore": overall,
                "narrative": narrative,
                "finished": response.finished,
            },
        )

        if response.finished:
            _emit(on_trace, "[AutoRun] 模拟触发结局，停止自动推进")
            break

    if episode.turns:
        last = episode.turns[-1]
        aggregate = last.aggregate
        overall = aggregate.overall_score
        ability_scores = aggregate.ability_scores
        agent_reviews = aggregate.agent_reviews
        if last.engine == "openai":
            engine = "openai"
    else:
        overall = 0.0
        ability_scores = []
        agent_reviews = []

    weak = _weak_dimensions(ability_scores)
    suggestions = _suggestions_from_reviews(weak, agent_reviews, payload.target_job)

    _emit(on_trace, f"[AutoRun] 模拟结束 · 共 {turns} 幕 · 最终得分 {overall:.1f}")
    if weak:
        _emit(on_trace, f"[AutoRun] 薄弱维度：{'、'.join(weak)}")
    _emit_turn(
        on_turn,
        {
            "phase": "finished",
            "turn": turns,
            "maxTurns": payload.max_turns,
            "overallScore": overall,
            "weakDimensions": weak,
            "turnsPlayed": turns,
        },
    )

    return SimulationAutoRunResponse(
        episode_id=episode.episode_id,
        overall_score=overall,
        ability_scores=ability_scores,
        agent_reviews=agent_reviews,
        weak_dimensions=weak,
        suggested_resume_modifications=suggestions,
        ending=episode.ending,
        engine=engine,
        turns_played=turns,
    )


def run_auto_simulation(
    payload: SimulationAutoRunRequest,
    *,
    on_trace: Callable[[str], None] | None = None,
    on_turn: Callable[[dict[str, Any]], None] | None = None,
) -> SimulationAutoRunResponse:
    return _run_auto_simulation_core(payload, on_trace=on_trace, on_turn=on_turn)


def run_auto_simulation_stream(payload: SimulationAutoRunRequest) -> Iterator[str]:
    def emit_trace(line: str) -> str:
        return f"event: trace\ndata: {json.dumps({'line': line}, ensure_ascii=False)}\n\n"

    def emit_turn(data: dict[str, Any]) -> str:
        return f"event: turn\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    rng = random.Random(hash((payload.student_id, payload.target_job, payload.resume_content[:80])) & 0xFFFFFFFF)
    target = _build_target(payload.resume_content, payload.target_job)

    yield emit_trace(f"[AutoRun] 启动求职模拟 · 岗位 {payload.target_job} · 策略 {payload.player_strategy}")
    yield emit_turn(
        {
            "phase": "started",
            "turn": 0,
            "maxTurns": payload.max_turns,
            "targetJob": payload.target_job,
            "strategy": payload.player_strategy,
        }
    )

    episode = start_episode(
        EpisodeStartRequest(
            student_id=payload.student_id,
            simulation_type=payload.simulation_type,
            target=target,
            seed=rng.randint(1, 99999),
        )
    )

    engine = "mock"
    turns = 0

    while episode.status == "running" and episode.current_event and turns < payload.max_turns:
        event = episode.current_event
        turn_no = turns + 1
        yield emit_trace(f"[AutoRun] 第 {turn_no}/{payload.max_turns} 幕 · {event.title}")
        yield emit_turn(
            {
                "phase": "turn_start",
                "turn": turn_no,
                "maxTurns": payload.max_turns,
                "eventTitle": event.title,
                "eventDescription": (event.description or "")[:240],
            }
        )

        choice, choice_engine = choose_episode_option(
            episode=episode,
            event=event,
            resume_context=payload.resume_content,
            target_job=payload.target_job,
            strategy=payload.player_strategy,
            rng=rng,
        )
        if choice_engine.startswith("openai"):
            engine = "openai"

        yield emit_trace(f"[AutoRun] 自动选择：{choice}（引擎 {choice_engine}）")
        yield emit_turn(
            {
                "phase": "choice_made",
                "turn": turn_no,
                "maxTurns": payload.max_turns,
                "eventTitle": event.title,
                "choice": choice,
                "engine": choice_engine,
            }
        )

        response = act_episode(episode.episode_id, EpisodeActionRequest(choice=choice, user_response=choice))
        if response is None:
            yield emit_trace("[AutoRun] 回合执行失败，提前结束")
            break

        episode = response.episode
        turns += 1

        last_turn = episode.turns[-1] if episode.turns else None
        narrative = ""
        overall = 0.0
        if last_turn:
            narrative = (last_turn.narrative or "")[:280]
            overall = last_turn.aggregate.overall_score
            if last_turn.engine == "openai":
                engine = "openai"

        yield emit_trace(f"[AutoRun] 第 {turn_no} 幕完成 · 当前总分 {overall:.1f}")
        if narrative:
            yield emit_trace(f"[AutoRun] 剧情：{narrative}")
        yield emit_turn(
            {
                "phase": "turn_complete",
                "turn": turn_no,
                "maxTurns": payload.max_turns,
                "eventTitle": event.title,
                "choice": choice,
                "overallScore": overall,
                "narrative": narrative,
                "finished": response.finished,
            }
        )

        if response.finished:
            yield emit_trace("[AutoRun] 模拟触发结局，停止自动推进")
            break

    if episode.turns:
        last = episode.turns[-1]
        aggregate = last.aggregate
        overall = aggregate.overall_score
        ability_scores = aggregate.ability_scores
        agent_reviews = aggregate.agent_reviews
        if last.engine == "openai":
            engine = "openai"
    else:
        overall = 0.0
        ability_scores = []
        agent_reviews = []

    weak = _weak_dimensions(ability_scores)
    suggestions = _suggestions_from_reviews(weak, agent_reviews, payload.target_job)

    yield emit_trace(f"[AutoRun] 模拟结束 · 共 {turns} 幕 · 最终得分 {overall:.1f}")
    if weak:
        yield emit_trace(f"[AutoRun] 薄弱维度：{'、'.join(weak)}")
    yield emit_turn(
        {
            "phase": "finished",
            "turn": turns,
            "maxTurns": payload.max_turns,
            "overallScore": overall,
            "weakDimensions": weak,
            "turnsPlayed": turns,
        }
    )

    result = SimulationAutoRunResponse(
        episode_id=episode.episode_id,
        overall_score=overall,
        ability_scores=ability_scores,
        agent_reviews=agent_reviews,
        weak_dimensions=weak,
        suggested_resume_modifications=suggestions,
        ending=episode.ending,
        engine=engine,
        turns_played=turns,
    )
    body = {
        "episodeId": result.episode_id,
        "overallScore": result.overall_score,
        "abilityScores": [
            {"key": s.key, "label": s.label, "score": s.score, "trend": s.trend} for s in result.ability_scores
        ],
        "agentReviews": [
            {
                "agent": r.agent,
                "score": r.score,
                "summary": r.summary,
                "highlights": r.highlights,
            }
            for r in result.agent_reviews
        ],
        "weakDimensions": result.weak_dimensions,
        "suggestedResumeModifications": result.suggested_resume_modifications,
        "ending": result.ending,
        "engine": result.engine,
        "turnsPlayed": result.turns_played,
    }
    yield f"event: result\ndata: {json.dumps(body, ensure_ascii=False)}\n\n"
