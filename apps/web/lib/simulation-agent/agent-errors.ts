export type AgentErrorCode =
  | "EPISODE_NOT_FOUND"
  | "EPISODE_COMPLETED"
  | "INVALID_INPUT"
  | "REACT_FAILED"
  | "STATE_PERSIST_FAILED"
  | "BACKEND_UNAVAILABLE";

export class AgentError extends Error {
  readonly code: AgentErrorCode;
  readonly status: number;
  readonly retryable: boolean;
  readonly correlationId: string;

  constructor(
    message: string,
    code: AgentErrorCode,
    status = 500,
    retryable = false,
    correlationId?: string,
  ) {
    super(message);
    this.name = "AgentError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.correlationId = correlationId ?? `agt_${Date.now().toString(36)}`;
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      retryable: this.retryable,
      correlationId: this.correlationId,
    };
  }
}

export type ToolObservation = {
  ok: boolean;
  retryable?: boolean;
  error?: string;
  errorCode?: string;
  [key: string]: unknown;
};

export function toolObs(payload: ToolObservation): string {
  return JSON.stringify(payload);
}

export function toolOk(extra: Record<string, unknown> = {}): string {
  return toolObs({ ok: true, ...extra });
}

export function toolErr(
  errorCode: string,
  error: string,
  retryable = true,
  extra: Record<string, unknown> = {},
): string {
  return toolObs({ ok: false, errorCode, error, retryable, ...extra });
}

export function newCorrelationId(): string {
  return `agt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
