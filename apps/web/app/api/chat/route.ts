import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(request: Request) {
  const { messages } = await request.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY 未配置，无法调用真实模型。" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const modelId = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const baseURL = process.env.OPENAI_BASE_URL;

  const provider = createOpenAI({
    apiKey,
    baseURL,
  });

  const result = streamText({
    model: provider(modelId),
    system:
      "你是智能人才发展平台的AI助手。请输出结构化、可执行、简洁的建议，优先围绕成长路径和求职能力提升。",
    messages,
  });

  return result.toDataStreamResponse();
}
