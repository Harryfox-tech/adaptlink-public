from __future__ import annotations

import json
from typing import Any, Callable
from uuid import uuid4

from langchain_core.tools import StructuredTool

from app.schemas.resume_optimizer import SimulationAutoRunRequest
from app.services.agent_llm_service import llm_generate_text, should_try_real_llm
from app.services.simulation_auto_run_service import run_auto_simulation


def _tool_obs(data: dict[str, Any]) -> str:
    if data.get("ok") is False:
        return json.dumps(data, ensure_ascii=False)
    return json.dumps({"ok": True, **{k: v for k, v in data.items() if k != "ok"}}, ensure_ascii=False)


def new_resume_optimizer_state(
    student_id: str,
    original_resume: str,
    target_job: str,
    iterations_max: int,
    score_target: float,
    player_strategy: str,
    session_id: str,
) -> dict[str, Any]:
    return {
        "sessionId": session_id,
        "studentId": student_id,
        "currentResume": original_resume.strip(),
        "targetJob": target_job.strip(),
        "playerStrategy": player_strategy,
        "iterationsMax": iterations_max,
        "scoreTarget": score_target,
        "iterationCount": 0,
        "originalScore": None,
        "bestScore": 0.0,
        "bestResume": original_resume.strip(),
        "history": [],
        "modificationLog": [],
        "reasoningTrace": [f"[ReAct/LangGraph] 简历优化 Agent 启动 ({session_id})"],
        "engine": "mock",
        "done": False,
        "lastWeakDimensions": [],
        "lastSuggestions": [],
    }


def _run_simulation(state: dict[str, Any]) -> str:
    if state["iterationCount"] >= state["iterationsMax"]:
        return _tool_obs({"ok": False, "error": "已达最大迭代次数", "iterationCount": state["iterationCount"]})

    state["iterationCount"] += 1
    result = run_auto_simulation(
        SimulationAutoRunRequest(
            student_id=state["studentId"],
            resume_content=state["currentResume"],
            target_job=state["targetJob"],
            simulation_type="job",
            player_strategy=state["playerStrategy"],
        )
    )
    if result.engine == "openai":
        state["engine"] = "openai"

    score = result.overall_score
    if state["originalScore"] is None:
        state["originalScore"] = score
    if score > state["bestScore"]:
        state["bestScore"] = score
        state["bestResume"] = state["currentResume"]

    state["lastWeakDimensions"] = result.weak_dimensions
    state["lastSuggestions"] = result.suggested_resume_modifications
    state["history"].append(
        {
            "iteration": state["iterationCount"],
            "overallScore": score,
            "weakDimensions": result.weak_dimensions,
            "resumePreview": state["currentResume"][:120],
        }
    )

    return _tool_obs(
        {
            "iteration": state["iterationCount"],
            "overallScore": score,
            "bestScore": state["bestScore"],
            "scoreTarget": state["scoreTarget"],
            "weakDimensions": result.weak_dimensions,
            "suggestions": result.suggested_resume_modifications,
        }
    )


def _rewrite_resume(state: dict[str, Any], focus: str) -> str:
    suggestions = state["lastSuggestions"] or ([focus] if focus else [])
    weak = state["lastWeakDimensions"]

    if should_try_real_llm() and suggestions:
        text, err = llm_generate_text(
            "你是简历优化专家。输出修改后的完整简历正文，不要 Markdown 代码块。",
            f"岗位：{state['targetJob']}\n薄弱项：{'、'.join(weak)}\n建议：{'；'.join(suggestions)}\n\n原简历：\n{state['currentResume'][:3500]}",
            temperature=0.35,
        )
        if text:
            state["currentResume"] = text.strip()
            state["modificationLog"].append(f"第{state['iterationCount']}轮：LLM 改写简历")
            state["engine"] = "openai"
            return _tool_obs({"chars": len(state["currentResume"]), "preview": state["currentResume"][:200]})
        if err:
            state["modificationLog"].append(f"改写失败：{err}")

    addition = (
        f"\n\n【ReAct优化·第{state['iterationCount']}轮】针对「{focus or (weak[0] if weak else state['targetJob'])}」"
        "补充量化成果与岗位关键词。"
    )
    if addition.strip() not in state["currentResume"]:
        state["currentResume"] = state["currentResume"].rstrip() + addition
    state["modificationLog"].append(f"第{state['iterationCount']}轮：规则追加段落")
    return _tool_obs({"mock": True, "chars": len(state["currentResume"])})


def _compare_progress(state: dict[str, Any]) -> str:
    current = state["history"][-1]["overallScore"] if state["history"] else 0
    should_stop = state["bestScore"] >= state["scoreTarget"] or state["iterationCount"] >= state["iterationsMax"]
    return _tool_obs(
        {
            "originalScore": state["originalScore"],
            "bestScore": state["bestScore"],
            "currentScore": current,
            "scoreTarget": state["scoreTarget"],
            "iterationsUsed": state["iterationCount"],
            "iterationsMax": state["iterationsMax"],
            "shouldStop": should_stop,
        }
    )


def _finish_optimization(state: dict[str, Any], summary: str) -> str:
    state["done"] = True
    state["currentResume"] = state["bestResume"]
    state["modificationLog"].append(f"完成：{summary}")
    return _tool_obs(
        {
            "optimizedResumeChars": len(state["currentResume"]),
            "originalScore": state["originalScore"],
            "finalScore": state["bestScore"],
            "summary": summary,
        }
    )


def create_resume_optimizer_tools(state: dict[str, Any]) -> list[StructuredTool]:
    return [
        StructuredTool.from_function(
            func=lambda: _run_simulation(state),
            name="runJobSimulation",
            description="用当前简历自动跑完一局求职剧情模拟，返回得分与薄弱项",
        ),
        StructuredTool.from_function(
            func=lambda focus="": _rewrite_resume(state, focus),
            name="rewriteResume",
            description="根据上一轮模拟暴露的薄弱项改写简历全文",
        ),
        StructuredTool.from_function(
            func=lambda: _compare_progress(state),
            name="compareProgress",
            description="查看当前得分进度，判断是否已达目标或应用尽迭代次数",
        ),
        StructuredTool.from_function(
            func=lambda summary: _finish_optimization(state, summary),
            name="finishOptimization",
            description="结束优化并输出最终简历（达标或无法再提升时调用）",
        ),
    ]


def run_resume_mock_react(state: dict[str, Any], on_trace: Callable[[str], None] | None = None) -> None:
    def trace(line: str) -> None:
        state.setdefault("reasoningTrace", []).append(line)
        if on_trace:
            on_trace(line)

    trace("[ReAct] Mock：无 OPENAI，单轮模拟后结束")
    trace("[Action] runJobSimulation({})")
    trace(f"[Observation] runJobSimulation: {_run_simulation(state)[:120]}")
    trace('[Action] finishOptimization({"summary":"Mock 单轮"})')
    _finish_optimization(state, "Mock 模式仅执行一轮自动模拟")
    trace(f"[Observation] finishOptimization: ok")


def new_session_id() -> str:
    return f"resume_agent_{uuid4().hex[:12]}"
