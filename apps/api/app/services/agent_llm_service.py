from __future__ import annotations

import json
from datetime import datetime

from app.core.config import get_settings
from app.schemas.simulations import SimulationAggregate, SimulationStartRequest

try:
    from openai import OpenAI
except Exception:  # noqa: BLE001
    OpenAI = None


def should_try_real_llm() -> bool:
    settings = get_settings()
    return settings.ai_provider == "openai"


def _get_client() -> tuple[OpenAI | None, str | None]:
    settings = get_settings()

    if settings.ai_provider != "openai":
        return None, "ai_provider is not openai"
    if not settings.openai_api_key:
        return None, "OPENAI_API_KEY is missing"
    if OpenAI is None:
        return None, "openai package is not installed"

    try:
        return OpenAI(api_key=settings.openai_api_key, base_url=settings.openai_base_url), None
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


def llm_generate_json(system_prompt: str, user_prompt: str, temperature: float = 0.5) -> tuple[dict | None, str | None]:
    settings = get_settings()
    client, err = _get_client()
    if client is None:
        return None, err

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=temperature,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            timeout=settings.llm_timeout_seconds,
        )
        content = response.choices[0].message.content or "{}"
        return json.loads(content), None
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


def llm_generate_text(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> tuple[str | None, str | None]:
    settings = get_settings()
    client, err = _get_client()
    if client is None:
        return None, err

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            timeout=settings.llm_timeout_seconds,
        )
        content = response.choices[0].message.content or ""
        return content.strip(), None
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


def run_llm_simulation(payload: SimulationStartRequest) -> tuple[SimulationAggregate | None, str | None]:
    if payload.simulation_type == "growth":
        dimensions = ["原则性", "责任感", "同理心", "领导力", "执行力", "协作能力", "沟通能力", "抗压能力"]
        agents = ["辅导员 Agent", "同伴观察 Agent", "组织考察 Agent", "职业发展导师 Agent", "汇总 Agent"]
    else:
        dimensions = [
            "沟通表达能力",
            "逻辑分析能力",
            "岗位理解能力",
            "执行与落地能力",
            "团队协作能力",
            "抗压能力",
            "学习潜力",
            "岗位匹配度",
        ]
        agents = ["HR 面试官 Agent", "业务面试官 Agent", "团队主管 Agent", "职业顾问 Agent", "汇总 Agent"]

    message_text = "\n".join([f"{m.role}: {m.content}" for m in payload.messages]) or "(无消息，基于场景初评)"

    system_prompt = """
你是智能人才平台的多智能体评估编排器。
你必须输出严格 JSON，不要输出 Markdown。
评分范围是 0-100。
trend 只能是 up / flat / down。
""".strip()

    user_prompt = f"""
请基于以下输入，生成结构化评估：
- 模拟器类型: {payload.simulation_type}
- 场景: {payload.scene}
- 目标岗位: {payload.target_job or '无'}
- 对话:
{message_text}

能力维度:
{json.dumps(dimensions, ensure_ascii=False)}

Agent 列表:
{json.dumps(agents, ensure_ascii=False)}

输出 JSON 字段：
{{
  "overall_score": number,
  "summary": string,
  "recommendations": string[],
  "ability_scores": [{{"key": string, "label": string, "score": number, "trend": "up|flat|down"}}],
  "agent_reviews": [{{"agent": string, "score": number, "summary": string, "highlights": string[]}}],
  "job_recommendations": [{{"job_id": string, "title": string, "company": string, "match_score": number, "reasons": string[]}}]
}}

如果是 growth 模拟器，job_recommendations 返回空数组。
""".strip()

    payload_json, err = llm_generate_json(system_prompt=system_prompt, user_prompt=user_prompt, temperature=0.2)
    if payload_json is None:
        return None, err

    aggregate_payload = {
        "session_id": f"sim_{payload.simulation_type}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "simulation_type": payload.simulation_type,
        "overall_score": payload_json.get("overall_score", 75),
        "summary": payload_json.get("summary", "模型未返回摘要，已使用默认内容。"),
        "recommendations": payload_json.get("recommendations", ["建议补充更多高质量回答样本。"]),
        "ability_scores": payload_json.get("ability_scores", []),
        "agent_reviews": payload_json.get("agent_reviews", []),
        "job_recommendations": payload_json.get("job_recommendations", []),
    }

    try:
        aggregate = SimulationAggregate.model_validate(aggregate_payload)
        return aggregate, None
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)
