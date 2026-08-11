import { generateText, type ToolSet } from "ai";

import type { ResumeOptimizerAgentState } from "./state";
import { getAgentModel, hasAgentLlm } from "@/lib/simulation-agent/model";
import { createResumeOptimizerTools, runResumeOptimizerMockFallback } from "./tools";

const RESUME_REACT_SYSTEM = `你是简历优化 ReAct Agent。目标：最大化「目标岗位」求职模拟得分。

循环策略（由你根据 Observation 自主决定）：
- runJobSimulation：用当前简历自动跑完整模拟，得到分数与薄弱项
- rewriteResume：针对薄弱项改写简历
- compareProgress：查看是否达到 scoreTarget 或迭代上限
- finishOptimization：输出最终简历并结束

规则：
- 至少先 runJobSimulation 一次再考虑 finish
- 若未达标且仍有迭代空间，应 rewriteResume 后再 runJobSimulation
- 达标或迭代用尽时必须 finishOptimization`;

function appendSteps(state: ResumeOptimizerAgentState, result: Awaited<ReturnType<typeof generateText>>) {
  if (result.text?.trim()) state.reasoningTrace.push(`[Thought] ${result.text.trim()}`);
  for (const step of result.steps ?? []) {
    if (step.text?.trim()) state.reasoningTrace.push(`[Thought] ${step.text.trim()}`);
    if ("toolCalls" in step && step.toolCalls) {
      for (const c of step.toolCalls) {
        state.reasoningTrace.push(`[Action] ${c.toolName}(${JSON.stringify(c.args)})`);
      }
    }
    const toolResults = (step as { toolResults?: { toolName: string; result: unknown }[] }).toolResults;
    if (toolResults) {
      for (const tr of toolResults) {
        const body =
          typeof tr.result === "string" ? tr.result.slice(0, 320) : JSON.stringify(tr.result)?.slice(0, 320);
        state.reasoningTrace.push(`[Observation] ${tr.toolName}: ${body}`);
      }
    }
  }
}

export async function runResumeOptimizerReAct(state: ResumeOptimizerAgentState) {
  if (!hasAgentLlm()) {
    await runResumeOptimizerMockFallback(state);
    return;
  }

  const model = getAgentModel();
  if (!model) {
    await runResumeOptimizerMockFallback(state);
    return;
  }

  const tools = createResumeOptimizerTools(state) as ToolSet;

  const result = await generateText({
    model,
    system: RESUME_REACT_SYSTEM,
    prompt: `
目标岗位: ${state.targetJob}
策略: ${state.playerStrategy}
迭代上限: ${state.iterationsMax}
目标分数: ${state.scoreTarget}
简历字数: ${state.currentResume.length}

请开始 ReAct，直到调用 finishOptimization。
`.trim(),
    tools,
    maxSteps: 20,
    onStepFinish: (step) => {
      if (step.text?.trim()) state.reasoningTrace.push(`[Thought] ${step.text.trim()}`);
    },
  });

  appendSteps(state, result);

  if (!state.done) {
    state.reasoningTrace.push("[ReAct] 未调用 finishOptimization，安全收尾");
    const { implCompareProgress, implFinishOptimization } = await import("./tools");
    implCompareProgress(state);
    implFinishOptimization(state, "达到步数上限或模型未显式结束");
  }
}
