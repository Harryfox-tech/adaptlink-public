from __future__ import annotations

import json
from collections.abc import Callable, Iterator
from typing import Any
from uuid import uuid4

from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from app.core.config import get_settings
from app.schemas.simulation_agent import AgentStepResult
from app.schemas.simulations import RecalledMemory
from app.services.agent_llm_service import should_try_real_llm
from app.services.agent_state_service import load_agent_state, save_agent_state
from app.services.langgraph_checkpointer import agent_run_config, get_langgraph_checkpointer
from app.services.simulation_agent_tools import (
    create_simulation_tools,
    episode_to_frontend_dict,
    new_episode_state,
    run_mock_react_fallback,
    state_to_simulation_episode,
)

SIMULATION_REACT_SYSTEM = """你是 AdaptLink 剧情模拟的 ReAct 导演 Agent。

工作方式（必须遵守）：
1. 先 Thought：简短说明为什么要调用下一个工具。
2. 再 Action：每次只做一个工具调用。
3. 读取 Observation（工具返回），再决定下一步。

阶段目标：
- start：召回长期记忆 → 生成第 1 幕事件 → 调用 waitForUserInput 结束本阶段。
- act：用玩家提交的选择评估本轮 → 检查是否结局 → 若未结局则 advanceStage + generateEvent → 若已结局则 finalizeEpisode → 最后 waitForUserInput。

禁止在未评估前生成下一幕；禁止在结局触发后继续 generateEvent。"""


def _new_correlation_id() -> str:
    return f"agt_{uuid4().hex[:12]}"


def _get_llm() -> ChatOpenAI | None:
    settings = get_settings()
    if not should_try_real_llm() or not settings.openai_api_key:
        return None
    return ChatOpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        model=settings.openai_model,
        temperature=0.4,
        timeout=settings.llm_timeout_seconds,
    )


def _build_prompt(phase: str, state: dict[str, Any], user_choice: str | None) -> str:
    if phase == "start":
        return f"""
阶段: start
studentId: {state['studentId']}
simulationType: {state['simulationType']}
target: {state['target']}
当前幕: {state['currentStage']}/{state['totalStagesDynamic']}

请开始 ReAct：先 retrieveMemories，再 generateEvent，最后 waitForUserInput。
""".strip()
    return f"""
阶段: act
episodeId: {state['episodeId']}
玩家选择: {user_choice or ''}
当前幕: {state['currentStage']}/{state['totalStagesDynamic']}
四维状态: {json.dumps(state.get('state'), ensure_ascii=False)}
当前事件: {(state.get('currentEvent') or {}).get('title', '无')}

请开始 ReAct：先 evaluatePlayerChoice(choice)，再 checkEnding。
- 若结局已触发：finalizeEpisode → waitForUserInput
- 若未触发：advanceStage → generateEvent → waitForUserInput
""".strip()


def _extract_trace_from_chunk(chunk: dict[str, Any], trace: list[str], on_trace: Callable[[str], None] | None) -> None:
    def push(line: str) -> None:
        if line and (not trace or trace[-1] != line):
            trace.append(line)
            if on_trace:
                on_trace(line)

    for _node, update in chunk.items():
        messages = update.get("messages") if isinstance(update, dict) else None
        if not messages:
            continue
        for msg in messages:
            if isinstance(msg, AIMessage):
                if msg.content and isinstance(msg.content, str) and msg.content.strip():
                    push(f"[Thought] {msg.content.strip()}")
                if msg.tool_calls:
                    for call in msg.tool_calls:
                        args = call.get("args") if isinstance(call, dict) else getattr(call, "args", {})
                        name = call.get("name") if isinstance(call, dict) else getattr(call, "name", "tool")
                        push(f"[Action] {name}({json.dumps(args, ensure_ascii=False)})")
            elif isinstance(msg, ToolMessage):
                preview = (msg.content or "")[:280]
                push(f"[Observation] {msg.name}: {preview}")


def _run_langgraph_react(
    state: dict[str, Any],
    phase: str,
    user_choice: str | None,
    max_steps: int,
    on_trace: Callable[[str], None] | None = None,
) -> None:
    for _kind, _payload in _run_langgraph_react_events(state, phase, user_choice, max_steps):
        if _kind == "trace" and on_trace:
            on_trace(str(_payload))


def _run_langgraph_react_events(
    state: dict[str, Any],
    phase: str,
    user_choice: str | None,
    max_steps: int,
) -> Iterator[tuple[str, Any]]:
    llm = _get_llm()
    if llm is None:
        buffer: list[str] = []

        def capture(line: str) -> None:
            buffer.append(line)

        run_mock_react_fallback(state, phase, user_choice, capture)
        for line in buffer:
            yield ("trace", line)
        yield ("done", state)
        return

    tools = create_simulation_tools(state)
    checkpointer = get_langgraph_checkpointer()
    agent = create_react_agent(
        llm,
        tools,
        state_modifier=SIMULATION_REACT_SYSTEM,
        checkpointer=checkpointer,
    )
    config = agent_run_config(state["episodeId"], recursion_limit=max_steps)
    prompt = _build_prompt(phase, state, user_choice)
    inputs = {"messages": [HumanMessage(content=prompt)]}

    trace = state.setdefault("reasoningTrace", [])
    try:
        for chunk in agent.stream(inputs, config=config, stream_mode="updates"):
            before = len(trace)
            _extract_trace_from_chunk(chunk, trace, None)
            for line in trace[before:]:
                yield ("trace", line)
    except Exception as exc:  # noqa: BLE001
        line = f"[ReAct] LangGraph error: {exc}"
        trace.append(line)
        yield ("trace", line)
        raise

    if not state.get("phaseComplete"):
        line = "[ReAct] 模型未调用 waitForUserInput，安全收尾"
        trace.append(line)
        yield ("trace", line)
        from app.services.simulation_agent_tools import (
            _generate_event,
            _retrieve_memories,
            _wait_for_user_input,
        )

        if phase == "start" and not state.get("currentEvent"):
            _retrieve_memories(state)
            _generate_event(state)
        _wait_for_user_input(state, "safety-net")

    yield ("done", state)


def _normalize_loaded_state(raw: dict[str, Any]) -> dict[str, Any]:
    """Accept camelCase from DB; ensure required keys."""
    if "episodeId" in raw:
        return raw
    # snake_case fallback
    mapping = {
        "episode_id": "episodeId",
        "student_id": "studentId",
        "simulation_type": "simulationType",
        "current_stage": "currentStage",
        "total_stages_dynamic": "totalStagesDynamic",
        "current_event": "currentEvent",
        "ending_type": "endingType",
        "event_history": "eventHistory",
        "player_choices": "playerChoices",
        "long_term_memories": "longTermMemories",
        "recalled_memories": "recalledMemories",
        "reasoning_trace": "reasoningTrace",
        "phase_complete": "phaseComplete",
        "last_turn_score": "lastTurnScore",
        "last_player_choice": "lastPlayerChoice",
    }
    out = dict(raw)
    for snake, camel in mapping.items():
        if snake in out and camel not in out:
            out[camel] = out.pop(snake)
    return out


def _persist_state(state: dict[str, Any]) -> bool:
    saved, _ = save_agent_state(
        episode_id=state["episodeId"],
        student_id=state["studentId"],
        agent_type="storyline",
        state=state,
    )
    if not saved:
        state.setdefault("reasoningTrace", []).append("[warn] 状态持久化失败（DATABASE_URL 不可用）")
    return saved


def _to_step_result(state: dict[str, Any]) -> AgentStepResult:
    episode = state_to_simulation_episode(state)
    finished = state.get("ending") is not None
    return AgentStepResult(
        episode=episode,
        finished=finished,
        ending_triggered=finished,
        reasoning_trace=state.get("reasoningTrace") or [],
        recalled_memories=episode.recalled_memories,
        engine=state.get("engine") or "mock",
    )


def run_agent_start(
    student_id: str,
    simulation_type: str,
    target: str,
    on_trace: Callable[[str], None] | None = None,
) -> AgentStepResult:
    correlation_id = _new_correlation_id()
    state = new_episode_state(student_id, simulation_type, target.strip(), correlation_id)
    _run_langgraph_react(state, "start", None, max_steps=12, on_trace=on_trace)
    _persist_state(state)
    return _to_step_result(state)


def run_agent_act(
    episode_id: str,
    choice: str,
    on_trace: Callable[[str], None] | None = None,
) -> AgentStepResult:
    correlation_id = _new_correlation_id()
    row = load_agent_state(episode_id)
    if row is None:
        raise ValueError("Episode not found")
    state = _normalize_loaded_state(dict(row["state"]))
    if state.get("status") == "completed":
        raise ValueError("Episode already completed")

    trimmed = choice.strip()
    if not trimmed:
        raise ValueError("Choice is required")

    state["phaseComplete"] = False
    line = f"[ReAct] 处理玩家行动 ({correlation_id})"
    state.setdefault("reasoningTrace", []).append(line)
    if on_trace:
        on_trace(line)

    _run_langgraph_react(state, "act", trimmed, max_steps=16, on_trace=on_trace)
    _persist_state(state)
    return _to_step_result(state)


def run_agent_start_stream(
    student_id: str,
    simulation_type: str,
    target: str,
) -> Iterator[str]:
    correlation_id = _new_correlation_id()
    state = new_episode_state(student_id, simulation_type, target.strip(), correlation_id)
    for kind, payload in _run_langgraph_react_events(state, "start", None, max_steps=12):
        if kind == "trace":
            yield f"event: trace\ndata: {json.dumps({'line': payload}, ensure_ascii=False)}\n\n"
    _persist_state(state)
    result = _to_step_result(state)
    yield f"event: result\ndata: {json.dumps(_result_payload(result), ensure_ascii=False)}\n\n"


def run_agent_act_stream(episode_id: str, choice: str) -> Iterator[str]:
    correlation_id = _new_correlation_id()
    row = load_agent_state(episode_id)
    if row is None:
        yield f"event: error\ndata: {json.dumps({'error': 'Episode not found', 'code': 'EPISODE_NOT_FOUND'}, ensure_ascii=False)}\n\n"
        return
    state = _normalize_loaded_state(dict(row["state"]))
    if state.get("status") == "completed":
        yield f"event: error\ndata: {json.dumps({'error': 'Episode already completed', 'code': 'EPISODE_COMPLETED'}, ensure_ascii=False)}\n\n"
        return
    trimmed = choice.strip()
    if not trimmed:
        yield f"event: error\ndata: {json.dumps({'error': 'Choice is required', 'code': 'INVALID_INPUT'}, ensure_ascii=False)}\n\n"
        return

    state["phaseComplete"] = False
    line = f"[ReAct] 处理玩家行动 ({correlation_id})"
    state.setdefault("reasoningTrace", []).append(line)
    yield f"event: trace\ndata: {json.dumps({'line': line}, ensure_ascii=False)}\n\n"

    for kind, payload in _run_langgraph_react_events(state, "act", trimmed, max_steps=16):
        if kind == "trace":
            yield f"event: trace\ndata: {json.dumps({'line': payload}, ensure_ascii=False)}\n\n"
    _persist_state(state)
    result = _to_step_result(state)
    yield f"event: result\ndata: {json.dumps(_result_payload(result), ensure_ascii=False)}\n\n"


def _result_payload(result: AgentStepResult) -> dict[str, Any]:
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
