from __future__ import annotations

import logging
from typing import Any

from langgraph.checkpoint.memory import MemorySaver

from app.core.db import get_psycopg_conninfo

logger = logging.getLogger(__name__)

_checkpointer: Any | None = None
_pool: Any | None = None
_postgres_setup_done = False


def get_langgraph_checkpointer() -> Any:
    """
    LangGraph 官方检查点：
    - 有 DATABASE_URL → PostgresSaver（表 checkpoints / checkpoint_writes 等）
    - 无 DB → MemorySaver（单进程内存）
    """
    global _checkpointer, _pool, _postgres_setup_done

    if _checkpointer is not None:
        return _checkpointer

    conninfo = get_psycopg_conninfo()
    if conninfo:
        try:
            from langgraph.checkpoint.postgres import PostgresSaver
            from psycopg_pool import ConnectionPool

            _pool = ConnectionPool(conninfo=conninfo, max_size=5, open=True)
            _checkpointer = PostgresSaver(_pool)
            if not _postgres_setup_done:
                _checkpointer.setup()
                _postgres_setup_done = True
            logger.info("LangGraph checkpointer: PostgresSaver enabled")
            return _checkpointer
        except Exception as exc:  # noqa: BLE001
            logger.warning("PostgresSaver init failed, fallback MemorySaver: %s", exc)

    _checkpointer = MemorySaver()
    logger.info("LangGraph checkpointer: MemorySaver (dev fallback)")
    return _checkpointer


def agent_run_config(thread_id: str, recursion_limit: int = 14) -> dict[str, Any]:
    return {
        "configurable": {"thread_id": thread_id},
        "recursion_limit": recursion_limit,
    }
