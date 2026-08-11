from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Any

import psycopg

from app.core.db import get_psycopg_conninfo

# 进行中 Agent 状态默认保留 48 小时
AGENT_STATE_TTL_HOURS = 48

_MEMORY_STORE: dict[str, dict[str, Any]] = {}


def _memory_save(episode_id: str, student_id: str, agent_type: str, state: dict[str, Any]) -> None:
    _MEMORY_STORE[episode_id] = {
        "episode_id": episode_id,
        "student_id": student_id,
        "agent_type": agent_type,
        "state": state,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def _memory_load(episode_id: str) -> dict[str, Any] | None:
    return _MEMORY_STORE.get(episode_id)


def _ensure_tables(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS app_simulation_agent_states (
                episode_id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                agent_type TEXT NOT NULL DEFAULT 'storyline',
                state_json JSONB NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                expires_at TIMESTAMPTZ NOT NULL
            )
            """
        )
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_agent_states_student
            ON app_simulation_agent_states(student_id, updated_at DESC)
            """
        )


def save_agent_state(
    episode_id: str,
    student_id: str,
    agent_type: str,
    state: dict[str, Any],
) -> tuple[bool, str | None]:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        _memory_save(episode_id, student_id, agent_type, state)
        return False, "DATABASE_URL missing"

    _memory_save(episode_id, student_id, agent_type, state)

    expires = datetime.now(timezone.utc) + timedelta(hours=AGENT_STATE_TTL_HOURS)
    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO app_simulation_agent_states
                        (episode_id, student_id, agent_type, state_json, updated_at, expires_at)
                    VALUES (%s, %s, %s, %s::jsonb, NOW(), %s)
                    ON CONFLICT (episode_id) DO UPDATE SET
                        student_id = EXCLUDED.student_id,
                        agent_type = EXCLUDED.agent_type,
                        state_json = EXCLUDED.state_json,
                        updated_at = NOW(),
                        expires_at = EXCLUDED.expires_at
                    """,
                    (
                        episode_id,
                        student_id,
                        agent_type,
                        json.dumps(state, ensure_ascii=False),
                        expires,
                    ),
                )
            conn.commit()
        return True, None
    except Exception as exc:  # noqa: BLE001
        return False, str(exc)


def load_agent_state(episode_id: str) -> dict[str, Any] | None:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return _memory_load(episode_id)

    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    DELETE FROM app_simulation_agent_states
                    WHERE expires_at < NOW()
                    """
                )
                cur.execute(
                    """
                    SELECT student_id, agent_type, state_json, updated_at
                    FROM app_simulation_agent_states
                    WHERE episode_id = %s AND expires_at >= NOW()
                    """,
                    (episode_id,),
                )
                row = cur.fetchone()
            conn.commit()
        if not row:
            return _memory_load(episode_id)
        student_id, agent_type, state_json, updated_at = row
        state = state_json if isinstance(state_json, dict) else json.loads(state_json)
        return {
            "episode_id": episode_id,
            "student_id": student_id,
            "agent_type": agent_type,
            "state": state,
            "updated_at": updated_at.isoformat() if updated_at else None,
        }
    except Exception:  # noqa: BLE001
        return _memory_load(episode_id)


def delete_agent_state(episode_id: str) -> bool:
    existed = episode_id in _MEMORY_STORE
    _MEMORY_STORE.pop(episode_id, None)
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return existed

    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM app_simulation_agent_states WHERE episode_id = %s",
                    (episode_id,),
                )
                deleted = cur.rowcount > 0
            conn.commit()
        return deleted
    except Exception:  # noqa: BLE001
        return False
