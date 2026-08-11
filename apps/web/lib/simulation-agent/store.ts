import type { EpisodeAgentState } from "./types";
import { loadAgentStateFromBackend, persistAgentStateToBackend, removeAgentStateOnBackend } from "./api-backend";

const globalStore = globalThis as typeof globalThis & {
  __simulationAgentStore?: Map<string, EpisodeAgentState>;
};

function getStore(): Map<string, EpisodeAgentState> {
  if (!globalStore.__simulationAgentStore) {
    globalStore.__simulationAgentStore = new Map();
  }
  return globalStore.__simulationAgentStore;
}

/** 进程内缓存 + PostgreSQL（经 FastAPI），多副本可恢复进行中 episode */
export async function saveAgentState(state: EpisodeAgentState): Promise<{ persisted: boolean }> {
  getStore().set(state.episodeId, state);
  try {
    const res = await persistAgentStateToBackend(state);
    return { persisted: res.persisted };
  } catch (e) {
    state.reasoningTrace.push(
      `[warn] 状态持久化失败: ${e instanceof Error ? e.message : "unknown"}（仅本 Pod 内存可用）`,
    );
    return { persisted: false };
  }
}

export async function getAgentState(episodeId: string): Promise<EpisodeAgentState | undefined> {
  const local = getStore().get(episodeId);
  if (local) return local;

  try {
    const remote = await loadAgentStateFromBackend(episodeId);
    if (remote) {
      getStore().set(episodeId, remote);
      return remote;
    }
  } catch {
    /* 后端不可用则仅依赖本进程缓存 */
  }
  return undefined;
}

export async function deleteAgentState(episodeId: string): Promise<void> {
  getStore().delete(episodeId);
  try {
    await removeAgentStateOnBackend(episodeId);
  } catch {
    /* ignore */
  }
}
