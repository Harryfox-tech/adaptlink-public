import { NextResponse } from "next/server";

import { AgentError } from "./agent-errors";

export function agentErrorResponse(e: unknown) {
  if (e instanceof AgentError) {
    return NextResponse.json(e.toJSON(), { status: e.status });
  }
  const message = e instanceof Error ? e.message : "Agent request failed";
  return NextResponse.json(
    {
      error: message,
      code: "REACT_FAILED",
      retryable: true,
    },
    { status: 500 },
  );
}
