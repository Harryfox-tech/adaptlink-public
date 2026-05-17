from __future__ import annotations

from datetime import datetime
from statistics import mean
from typing import Literal

from app.schemas.common import AbilityDimension, AgentReview
from app.schemas.simulations import JobRecommendation, SimulationAggregate, SimulationHistoryResponse, SimulationStartRequest
from app.services.agent_llm_service import run_llm_simulation, should_try_real_llm
from app.services.simulation_persistence_service import simulation_persistence_service


def _mock_ability_scores(simulation_type: Literal["growth", "job"]) -> list[AbilityDimension]:
    if simulation_type == "growth":
        return [
            AbilityDimension(key="principle", label="原则性", score=85, trend="up"),
            AbilityDimension(key="responsibility", label="责任感", score=89, trend="up"),
            AbilityDimension(key="empathy", label="同理心", score=76, trend="flat"),
            AbilityDimension(key="leadership", label="领导力", score=79, trend="up"),
            AbilityDimension(key="execution", label="执行力", score=87, trend="up"),
            AbilityDimension(key="collaboration", label="协作能力", score=81, trend="up"),
            AbilityDimension(key="communication", label="沟通能力", score=77, trend="flat"),
            AbilityDimension(key="resilience", label="抗压能力", score=82, trend="up"),
        ]

    return [
        AbilityDimension(key="communication", label="沟通表达能力", score=78, trend="up"),
        AbilityDimension(key="logic", label="逻辑分析能力", score=75, trend="flat"),
        AbilityDimension(key="job_understanding", label="岗位理解能力", score=84, trend="up"),
        AbilityDimension(key="execution", label="执行与落地能力", score=80, trend="up"),
        AbilityDimension(key="teamwork", label="团队协作能力", score=82, trend="up"),
        AbilityDimension(key="resilience", label="抗压能力", score=73, trend="flat"),
        AbilityDimension(key="learning", label="学习潜力", score=81, trend="up"),
        AbilityDimension(key="fit", label="岗位匹配度", score=79, trend="up"),
    ]


def _mock_agent_reviews(simulation_type: Literal["growth", "job"]) -> list[AgentReview]:
    if simulation_type == "growth":
        return [
            AgentReview(agent="辅导员 Agent", score=84, summary="规则意识与责任感较强。", highlights=["主动担责", "目标导向"]),
            AgentReview(agent="同伴观察 Agent", score=79, summary="合作稳定，冲突沟通可优化。", highlights=["倾听积极", "反馈及时"]),
            AgentReview(agent="组织考察 Agent", score=82, summary="任务推进效率较高。", highlights=["节点管理", "流程执行"]),
            AgentReview(agent="职业发展导师 Agent", score=83, summary="成长潜力显著，建议持续复盘。", highlights=["学习意愿", "改进行动"]),
        ]

    return [
        AgentReview(agent="HR 面试官 Agent", score=80, summary="表达自然，职业动机明确。", highlights=["动机稳定", "表达完整"]),
        AgentReview(agent="业务面试官 Agent", score=77, summary="分析框架较清晰，案例深度不足。", highlights=["问题拆解", "业务理解"]),
        AgentReview(agent="团队主管 Agent", score=78, summary="协作意识良好，压力追问需更坚定。", highlights=["团队配合", "复盘意识"]),
        AgentReview(agent="职业顾问 Agent", score=81, summary="方向与能力结构匹配，建议补齐量化表达。", highlights=["方向清晰", "发展潜力"]),
    ]


def _mock_job_recommendations() -> list[JobRecommendation]:
    return [
        JobRecommendation(
            job_id="job_001",
            title="产品运营专员",
            company="星澜科技",
            match_score=86,
            reasons=["沟通协作能力匹配岗位要求", "执行力与复盘意识较强"],
        ),
        JobRecommendation(
            job_id="job_002",
            title="校园市场培训生",
            company="映河教育",
            match_score=81,
            reasons=["适应快节奏活动场景", "同理心与服务意识较好"],
        ),
        JobRecommendation(
            job_id="job_003",
            title="数据运营助理",
            company="云策数据",
            match_score=77,
            reasons=["逻辑分析能力中上", "建议提升指标拆解深度"],
        ),
    ]


def run_mock_simulation_workflow(payload: SimulationStartRequest) -> SimulationAggregate:
    ability_scores = _mock_ability_scores(payload.simulation_type)
    reviews = _mock_agent_reviews(payload.simulation_type)

    overall_score = round(mean([item.score for item in reviews]), 2)
    summary = (
        "你在成长场景中展现出较强责任意识与执行稳定性，建议继续提升高压沟通能力。"
        if payload.simulation_type == "growth"
        else "你的岗位理解与协作能力较好，建议增强压力问答中的结构化表达。"
    )

    recommendations = (
        [
            "每周复盘一次关键协作事件，沉淀改进行动。",
            "冲突对话中先复述对方诉求，再表达立场。",
            "将任务拆分为里程碑并公开同步进展。",
        ]
        if payload.simulation_type == "growth"
        else [
            "使用 STAR 框架回答行为面试问题。",
            "增加数据化结果表述，提高说服力。",
            "针对目标岗位准备 3 个业务分析案例。",
        ]
    )

    return SimulationAggregate(
        session_id=f"sim_{payload.simulation_type}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        simulation_type=payload.simulation_type,
        overall_score=overall_score,
        summary=summary,
        recommendations=recommendations,
        ability_scores=ability_scores,
        agent_reviews=reviews,
        job_recommendations=_mock_job_recommendations() if payload.simulation_type == "job" else [],
    )


def run_simulation_and_persist(payload: SimulationStartRequest) -> tuple[SimulationAggregate, str, str | None]:
    """
    Dual fallback chain:
    1) Try real LLM workflow when configured.
    2) If real LLM fails, fallback to backend mock workflow.
    3) Frontend still has API-level fallback to local mock if backend is unreachable.
    """
    aggregate: SimulationAggregate
    engine = "mock"
    fallback_reason: str | None = None

    if should_try_real_llm():
        llm_result, llm_error = run_llm_simulation(payload)
        if llm_result is not None:
            aggregate = llm_result
            engine = "openai"
        else:
            aggregate = run_mock_simulation_workflow(payload)
            fallback_reason = llm_error
    else:
        aggregate = run_mock_simulation_workflow(payload)

    persistence = simulation_persistence_service.save_simulation(payload, aggregate)
    if not persistence.saved and not fallback_reason:
        fallback_reason = persistence.reason

    return aggregate, engine, fallback_reason


def get_latest_simulation(student_id: str, simulation_type: Literal["growth", "job"]) -> SimulationAggregate:
    persisted = simulation_persistence_service.get_latest_simulation(student_id=student_id, simulation_type=simulation_type)
    if persisted is not None:
        return persisted

    request = SimulationStartRequest(
        student_id=student_id,
        simulation_type=simulation_type,
        scene="latest_snapshot",
    )
    return run_mock_simulation_workflow(request)


def get_simulation_history(student_id: str, limit: int = 20) -> SimulationHistoryResponse:
    persisted = simulation_persistence_service.get_simulation_history(student_id=student_id, limit=limit)
    if persisted is not None and persisted.items:
        return persisted

    return SimulationHistoryResponse(
        student_id=student_id,
        items=[],
    )
