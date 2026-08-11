import { generateText, type ToolSet } from "ai";

import type { EpisodeAgentState } from "./types";
import { getAgentModel, hasAgentLlm } from "./model";
import { createSimulationTools, runMockReActFallback } from "./tools";

const SIMULATION_REACT_SYSTEM = `你是 AdaptLink 剧情模拟的 ReAct 导演 Agent。

工作方式（必须遵守）：
1. 先 Thought：简短说明为什么要调用下一个工具（会在界面展示）。
2. 再 Action：每次只做一个工具调用。
3. 读取 Observation（工具返回），再决定下一步。

阶段目标：
- start：召回长期记忆 → 生成第 1 幕事件 → 调用 waitForUserInput 结束本阶段。
- act：用玩家提交的选择评估本轮 → 检查是否结局 → 若未结局则 advanceStage + generateEvent → 若已结局则 finalizeEpisode → 最后 waitForUserInput。

禁止在未评估前生成下一幕；禁止在结局触发后继续 generateEvent。`;

function pushTrace(state: EpisodeAgentState, line: string, onTraceLine?: (line: string) => void) {
  state.reasoningTrace.push(line);
  onTraceLine?.(line);
}

function appendFromGenerateResult(
  state: EpisodeAgentState,
  result: Awaited<ReturnType<typeof generateText>>,
  onTraceLine?: (line: string) => void,
) {
  if (result.text?.trim()) {
    pushTrace(state, `[Thought] ${result.text.trim()}`, onTraceLine);
  }
  for (const step of result.steps ?? []) {
    if (step.text?.trim()) {
      pushTrace(state, `[Thought] ${step.text.trim()}`, onTraceLine);
    }
    if ("toolCalls" in step && step.toolCalls) {
      for (const call of step.toolCalls) {
        pushTrace(state, `[Action] ${call.toolName}(${JSON.stringify(call.args)})`, onTraceLine);
      }
    }
    const toolResults = (step as { toolResults?: { toolName: string; result: unknown }[] }).toolResults;
    if (toolResults) {
      for (const tr of toolResults) {
        const preview =
          typeof tr.result === "string"
            ? tr.result.slice(0, 280)
            : JSON.stringify(tr.result)?.slice(0, 280) ?? "";
        pushTrace(state, `[Observation] ${tr.toolName}: ${preview}`, onTraceLine);
      }
    }
  }
}

export async function runSimulationReAct(input: {
  state: EpisodeAgentState;
  phase: "start" | "act";
  userChoice?: string;
  maxSteps?: number;
  onTraceLine?: (line: string) => void;
}): Promise<void> {
  const { state, phase, userChoice, onTraceLine } = input;

  if (!hasAgentLlm()) {
    await runMockReActFallback(state, phase, userChoice);
    return;
  }

  const model = getAgentModel();
  if (!model) {
    await runMockReActFallback(state, phase, userChoice);
    return;
  }

  const tools = createSimulationTools(state) as ToolSet;

  const prompt =
    phase === "start"
      ? `
阶段: start
studentId: ${state.studentId}
simulationType: ${state.simulationType}
target: ${state.target}
当前幕: ${state.currentStage}/${state.totalStagesDynamic}

请开始 ReAct：先 retrieveMemories，再 generateEvent，最后 waitForUserInput。
`.trim()
      : `
阶段: act
episodeId: ${state.episodeId}
玩家选择: ${userChoice ?? ""}
当前幕: ${state.currentStage}/${state.totalStagesDynamic}
四维状态: ${JSON.stringify(state.state)}
当前事件: ${state.currentEvent?.title ?? "无"}

请开始 ReAct：先 evaluatePlayerChoice(choice)，再 checkEnding。
- 若结局已触发：finalizeEpisode → waitForUserInput
- 若未触发：advanceStage → generateEvent → waitForUserInput
`.trim();

  const result = await generateText({
    model,
    system: SIMULATION_REACT_SYSTEM,
    prompt,
    tools,
    maxSteps: input.maxSteps ?? 14,
    onStepFinish: (step) => {
      if (step.text?.trim()) {
        pushTrace(state, `[Thought] ${step.text.trim()}`, onTraceLine);
      }
    },
  });

  appendFromGenerateResult(state, result, onTraceLine);

  if (!state.phaseComplete) {
    pushTrace(state, "[ReAct] 模型未调用 waitForUserInput，安全收尾", onTraceLine);
    const { implRetrieveMemories, implGenerateEvent, implWaitForUserInput } = await import("./tools");
    if (phase === "start" && !state.currentEvent) {
      await implRetrieveMemories(state);
      await implGenerateEvent(state);
    }
    implWaitForUserInput(state, "safety-net");
  }
}
