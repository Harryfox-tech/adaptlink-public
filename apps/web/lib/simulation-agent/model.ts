import { createOpenAI } from "@ai-sdk/openai";

export function getAgentModel() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const provider = createOpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL,
  });
  const modelId = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  return provider(modelId);
}

export function hasAgentLlm(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
