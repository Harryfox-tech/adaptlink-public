from __future__ import annotations

import random
from typing import Literal

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


def run_auto_simulation(payload: SimulationAutoRunRequest) -> SimulationAutoRunResponse:
    rng = random.Random(hash((payload.student_id, payload.target_job, payload.resume_content[:80])) & 0xFFFFFFFF)
    target = _build_target(payload.resume_content, payload.target_job)

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

        response = act_episode(episode.episode_id, EpisodeActionRequest(choice=choice, user_response=choice))
        if response is None:
            break
        episode = response.episode
        turns += 1
        if response.finished:
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
