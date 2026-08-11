from __future__ import annotations

import random
from typing import Literal

from app.schemas.simulations import EpisodeEvent, EpisodeState, SimulationEpisode
from app.services.agent_llm_service import llm_generate_text, should_try_real_llm

PlayerStrategy = Literal["conservative", "aggressive", "random"]


def _strategy_hint(strategy: PlayerStrategy) -> str:
    if strategy == "conservative":
        return "稳重务实，优先选风险更低、可执行、先澄清再行动的路径。"
    if strategy == "aggressive":
        return "进取主动，优先选能展现领导力、担当与突破的局面。"
    return "随机探索，但仍需与简历能力相符。"


def _fallback_choice(options: list[str], strategy: PlayerStrategy, rng: random.Random) -> str:
    if not options:
        return ""
    if strategy == "random":
        return rng.choice(options)
    if strategy == "aggressive":
        return options[-1]
    return options[0]


def _match_option(selected: str, options: list[str]) -> str:
    cleaned = selected.strip()
    if cleaned in options:
        return cleaned
    for opt in options:
        if cleaned in opt or opt in cleaned:
            return opt
    return options[0] if options else cleaned


def choose_episode_option(
    *,
    episode: SimulationEpisode,
    event: EpisodeEvent,
    resume_context: str,
    target_job: str,
    strategy: PlayerStrategy,
    rng: random.Random | None = None,
) -> tuple[str, str]:
    """Return (choice, engine)."""
    options = event.choices or []
    if not options:
        return "继续推进并给出结构化方案", "mock"

    if strategy == "random":
        return rng.choice(options) if rng else random.choice(options), "mock"

    if not should_try_real_llm():
        return _fallback_choice(options, strategy, rng or random.Random()), "mock"

    state: EpisodeState = episode.state
    system_prompt = "你是求职情景模拟中的玩家代理人。只输出一个选项原文，不要解释。"
    user_prompt = f"""
简历背景（节选）：
{resume_context[:1200]}

目标岗位：{target_job}
当前幕：{episode.current_stage}
四维状态：信心{state.confidence} 压力{state.pressure} 精力{state.energy} 准备度{state.readiness}

剧情：{event.title}
{event.description[:600]}

NPC：{event.npc_role}，目标：{event.npc_goal}

可选行动（必须从中选一，原样输出其一）：
{chr(10).join(f"- {o}" for o in options)}

策略：{_strategy_hint(strategy)}
""".strip()

    text, err = llm_generate_text(system_prompt=system_prompt, user_prompt=user_prompt, temperature=0.4)
    if text:
        return _match_option(text, options), "openai"
    return _fallback_choice(options, strategy, rng or random.Random()), f"mock:{err or 'llm_failed'}"
