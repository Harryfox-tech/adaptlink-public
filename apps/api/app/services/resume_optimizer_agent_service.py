from __future__ import annotations

import json
from collections.abc import Callable, Iterator
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from app.core.config import get_settings
from app.schemas.resume_optimizer import (
    ResumeOptimizeIteration,
    ResumeOptimizeRequest,
    ResumeOptimizeResponse,
)
from app.services.agent_llm_service import should_try_real_llm
from app.services.agent_state_service import save_agent_state
from app.services.langgraph_checkpointer import agent_run_config, get_langgraph_checkpointer
from app.services.resume_optimizer_agent_tools import (
    create_resume_optimizer_tools,
    new_resume_optimizer_state,
    new_session_id,
    run_resume_mock_react,
)

RESUME_REACT_SYSTEM = """你是简历优化 ReAct Agent。目标：最大化「目标岗位」求职模拟得分。

可用工具：
- runJobSimulation：用当前简历自动跑完整模拟，得到分数与薄弱项
- rewriteResume：针对薄弱项改写简历
- compareProgress：查看是否达到 scoreTarget 或迭代上限
- finishOptimization：输出最终简历并结束

规则：
- 至少先 runJobSimulation 一次再考虑 finish
- 若未达标且仍有迭代空间，应 rewriteResume 后再 runJobSimulation
- 达标或迭代用尽时必须 finishOptimization"""


def _get_llm() -> ChatOpenAI | None:
    settings = get_settings()
    if not should_try_real_llm() or not settings.openai_api_key:
        return None
    return ChatOpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        model=settings.openai_model,
        temperature=0.35,
        timeout=settings.llm_timeout_seconds,
    )


def _extract_trace(chunk: dict[str, Any], trace: list[str]) -> list[str]:
    new_lines: list[str] = []
    for _node, update in chunk.items():
        messages = update.get("messages") if isinstance(update, dict) else None
        if not messages:
            continue
        for msg in messages:
            if isinstance(msg, AIMessage):
                if msg.content and isinstance(msg.content, str) and msg.content.strip():
                    line = f"[Thought] {msg.content.strip()}"
                    if not trace or trace[-1] != line:
                        trace.append(line)
                        new_lines.append(line)
                if msg.tool_calls:
                    for call in msg.tool_calls:
                        args = call.get("args") if isinstance(call, dict) else getattr(call, "args", {})
                        name = call.get("name") if isinstance(call, dict) else getattr(call, "name", "tool")
                        line = f"[Action] {name}({json.dumps(args, ensure_ascii=False)})"
                        trace.append(line)
                        new_lines.append(line)
            elif isinstance(msg, ToolMessage):
                preview = (msg.content or "")[:280]
                line = f"[Observation] {msg.name}: {preview}"
                trace.append(line)
                new_lines.append(line)
    return new_lines


def _run_react_events(
    state: dict[str, Any],
    prompt: str,
    max_steps: int,
) -> Iterator[tuple[str, Any]]:
    llm = _get_llm()
    session_id = state["sessionId"]

    if llm is None:
        buffer: list[str] = []

        def capture(line: str) -> None:
            buffer.append(line)

        run_resume_mock_react(state, capture)
        for line in buffer:
            yield ("trace", line)
        yield ("done", state)
        return

    tools = create_resume_optimizer_tools(state)
    checkpointer = get_langgraph_checkpointer()
    agent = create_react_agent(llm, tools, state_modifier=RESUME_REACT_SYSTEM, checkpointer=checkpointer)
    config = agent_run_config(session_id, recursion_limit=max_steps)
    trace = state.setdefault("reasoningTrace", [])

    try:
        for chunk in agent.stream(
            {"messages": [HumanMessage(content=prompt)]},
            config=config,
            stream_mode="updates",
        ):
            for line in _extract_trace(chunk, trace):
                yield ("trace", line)
    except Exception as exc:  # noqa: BLE001
        line = f"[ReAct] LangGraph error: {exc}"
        trace.append(line)
        yield ("trace", line)
        run_resume_mock_react(state)
        yield ("done", state)
        return

    if not state.get("done"):
        line = "[ReAct] 未调用 finishOptimization，安全收尾"
        trace.append(line)
        yield ("trace", line)
        from app.services.resume_optimizer_agent_tools import _finish_optimization

        _finish_optimization(state, "safety-net finish")

    yield ("done", state)


def _persist_domain_state(state: dict[str, Any]) -> None:
    save_agent_state(
        episode_id=state["sessionId"],
        student_id=state["studentId"],
        agent_type="resume_optimizer",
        state=state,
    )


def _to_response(state: dict[str, Any]) -> ResumeOptimizeResponse:
    history = [
        ResumeOptimizeIteration(
            iteration=h["iteration"],
            overall_score=h["overallScore"],
            weak_dimensions=h.get("weakDimensions") or [],
            resume_preview=h.get("resumePreview") or "",
        )
        for h in state.get("history") or []
    ]
    return ResumeOptimizeResponse(
        optimized_resume=state.get("currentResume") or state.get("bestResume") or "",
        original_score=float(state.get("originalScore") or 0),
        final_score=float(state.get("bestScore") or 0),
        improvement_history=history,
        modification_log=state.get("modificationLog") or [],
        suggested_resume_modifications=state.get("lastSuggestions") or [],
        engine=state.get("engine") or "mock",
        reasoning_trace=state.get("reasoningTrace") or [],
    )


def optimize_resume_with_agent(payload: ResumeOptimizeRequest) -> ResumeOptimizeResponse:
    session_id = new_session_id()
    state = new_resume_optimizer_state(
        student_id=payload.student_id,
        original_resume=payload.original_resume,
        target_job=payload.target_job,
        iterations_max=payload.iterations,
        score_target=payload.score_target,
        player_strategy=payload.player_strategy,
        session_id=session_id,
    )
    prompt = f"""
目标岗位: {payload.target_job}
策略: {payload.player_strategy}
迭代上限: {payload.iterations}
分数目标: {payload.score_target}
简历字数: {len(payload.original_resume)}

请开始 ReAct：先 runJobSimulation，再根据 compareProgress 决定是否 rewriteResume 并继续，最后 finishOptimization。
""".strip()

    for kind, _ in _run_react_events(state, prompt, max_steps=20):
        if kind == "done":
            break

    _persist_domain_state(state)
    return _to_response(state)


def optimize_resume_agent_stream(payload: ResumeOptimizeRequest) -> Iterator[str]:
    import queue
    import threading

    event_q: queue.Queue[tuple[str, Any]] = queue.Queue()
    session_id = new_session_id()
    state = new_resume_optimizer_state(
        student_id=payload.student_id,
        original_resume=payload.original_resume,
        target_job=payload.target_job,
        iterations_max=payload.iterations,
        score_target=payload.score_target,
        player_strategy=payload.player_strategy,
        session_id=session_id,
    )

    def live_trace(line: str) -> None:
        event_q.put(("trace", line))

    def live_turn(data: dict[str, Any]) -> None:
        event_q.put(("turn", data))

    state["_liveTraceSink"] = live_trace
    state["_liveTurnSink"] = live_turn

    prompt = f"""
目标岗位: {payload.target_job}
策略: {payload.player_strategy}
迭代上限: {payload.iterations}
分数目标: {payload.score_target}

请开始 ReAct 简历优化循环。
""".strip()

    error_box: list[Exception] = []
    result_box: list[ResumeOptimizeResponse] = []

    def worker() -> None:
        try:
            for kind, payload_line in _run_react_events(state, prompt, max_steps=20):
                if kind == "trace":
                    event_q.put(("trace", payload_line))
                elif kind == "done":
                    break
            _persist_domain_state(state)
            result_box.append(_to_response(state))
        except Exception as exc:  # noqa: BLE001
            error_box.append(exc)
        finally:
            event_q.put(("finished", None))

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()

    while True:
        kind, data = event_q.get()
        if kind == "finished":
            break
        if kind == "trace":
            yield f"event: trace\ndata: {json.dumps({'line': data}, ensure_ascii=False)}\n\n"
        elif kind == "turn":
            yield f"event: turn\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    if error_box:
        yield f"event: error\ndata: {json.dumps({'error': str(error_box[0])}, ensure_ascii=False)}\n\n"
        return

    if not result_box:
        yield f"event: error\ndata: {json.dumps({'error': 'Resume agent produced no result'}, ensure_ascii=False)}\n\n"
        return

    result = result_box[0]
    body = {
        "optimizedResume": result.optimized_resume,
        "originalScore": result.original_score,
        "finalScore": result.final_score,
        "improvementHistory": [
            {
                "iteration": h.iteration,
                "overallScore": h.overall_score,
                "weakDimensions": h.weak_dimensions,
                "resumePreview": h.resume_preview,
            }
            for h in result.improvement_history
        ],
        "modificationLog": result.modification_log,
        "suggestedModifications": result.suggested_resume_modifications,
        "reasoningTrace": result.reasoning_trace,
        "engine": result.engine,
    }
    yield f"event: result\ndata: {json.dumps(body, ensure_ascii=False)}\n\n"
