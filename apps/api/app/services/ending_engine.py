from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from app.schemas.simulations import EpisodeEnding, EpisodeState, SimulationEpisode

EndingType = Literal["good", "neutral", "bad", "secret"]


@dataclass
class EndingEvaluation:
    triggered: bool
    ending_type: EndingType | None = None
    ending: EpisodeEnding | None = None


def _avg_turn_score(episode: SimulationEpisode) -> float:
    if not episode.turns:
        return 50.0
    return sum(t.aggregate.overall_score for t in episode.turns) / len(episode.turns)


def evaluate_ending(episode: SimulationEpisode) -> EndingEvaluation:
    """Dynamic ending: early good/bad/neutral or forced end at max stage."""
    s = episode.state
    stage = episode.current_stage
    total = getattr(episode, "total_stages_dynamic", None) or episode.total_stages
    max_stage = min(6, max(total, 4))
    avg = _avg_turn_score(episode)
    target_short = (episode.target or "当前目标")[:42]

    if stage < 2:
        if stage >= max_stage:
            pass
        else:
            return EndingEvaluation(triggered=False)

    if s.confidence >= 85 and s.pressure <= 22 and s.readiness >= 78 and stage >= 3:
        return EndingEvaluation(
            triggered=True,
            ending_type="good",
            ending=_good_ending(episode, target_short, avg, secret=False),
        )

    if s.confidence >= 80 and s.pressure <= 28 and s.readiness >= 72 and stage >= 3:
        return EndingEvaluation(
            triggered=True,
            ending_type="good",
            ending=_good_ending(episode, target_short, avg, secret=False),
        )

    if s.pressure >= 88 and s.energy <= 25 and stage >= 2:
        return EndingEvaluation(
            triggered=True,
            ending_type="bad",
            ending=_bad_ending(episode, target_short),
        )

    if s.confidence <= 28 and s.readiness <= 30 and stage >= 3:
        return EndingEvaluation(
            triggered=True,
            ending_type="bad",
            ending=_bad_ending(episode, target_short),
        )

    if (
        s.confidence >= 90
        and s.readiness >= 85
        and s.pressure <= 35
        and stage >= 4
        and avg >= 85
    ):
        return EndingEvaluation(
            triggered=True,
            ending_type="secret",
            ending=_good_ending(episode, target_short, avg, secret=True),
        )

    if stage >= max_stage or stage >= 6:
        if avg >= 75 and s.readiness >= 65:
            return EndingEvaluation(
                triggered=True,
                ending_type="neutral",
                ending=_neutral_ending(episode, target_short, positive=True),
            )
        if avg >= 60:
            return EndingEvaluation(
                triggered=True,
                ending_type="neutral",
                ending=_neutral_ending(episode, target_short, positive=False),
            )
        return EndingEvaluation(
            triggered=True,
            ending_type="bad",
            ending=_bad_ending(episode, target_short),
        )

    return EndingEvaluation(triggered=False)


def _good_ending(episode: SimulationEpisode, target: str, avg: float, secret: bool) -> EpisodeEnding:
    if episode.simulation_type == "job":
        code = "JOB_OFFER_ELITE" if secret else "JOB_OFFER_STRONG"
        title = "隐藏高光 Offer" if secret else "高匹配 Offer 结局"
        summary = f"围绕「{target}」，你在第 {episode.current_stage} 幕即展现出稳定结构与强抗压，系统判定可提前收官。"
    else:
        code = "GROWTH_LEGEND" if secret else "GROWTH_LEADER"
        title = "隐藏成长传奇" if secret else "成长领航者结局"
        summary = f"围绕「{target}」，你在关键节点持续高质量决策（均分 {avg:.0f}），提前进入收官。"

    return EpisodeEnding(
        code=code,
        title=title,
        summary=summary,
        next_steps=[
            "沉淀本轮关键决策为可复述案例",
            "将优势维度写入简历与投递包",
            "一周后用新目标开启下一轮模拟",
        ],
    )


def _bad_ending(episode: SimulationEpisode, target: str) -> EpisodeEnding:
    if episode.simulation_type == "job":
        return EpisodeEnding(
            code="JOB_STALL",
            title="承压失守结局",
            summary=f"围绕「{target}」，高压下表达与结构失衡，建议专项训练后再挑战。",
            next_steps=["STAR 模板专项练习", "补 2 个业务案例", "降低压力阈值后重试"],
        )
    return EpisodeEnding(
        code="GROWTH_STALL",
        title="局势失控结局",
        summary=f"围绕「{target}」，协作或冲突处理失衡，需要先重建稳定行为模式。",
        next_steps=["单点任务建立正反馈", "引入同伴反馈", "固定每周复盘"],
    )


def _neutral_ending(episode: SimulationEpisode, target: str, positive: bool) -> EpisodeEnding:
    if positive:
        return EpisodeEnding(
            code="NEUTRAL_STEADY",
            title="平稳收官",
            summary=f"围绕「{target}」，你完成了完整剧情线，表现稳健但未触发高光结局。",
            next_steps=["挑 1 个薄弱维度专项练", "尝试更激进策略测试上限", "记录可迁移的方法论"],
        )
    return EpisodeEnding(
        code="NEUTRAL_FLAT",
        title="平淡落幕",
        summary=f"围绕「{target}」，你平安度过这段时期，但尚未留下深刻印记。",
        next_steps=["明确下一阶段单一改进目标", "增加高压场景练习频次", "寻求外部反馈"],
    )
