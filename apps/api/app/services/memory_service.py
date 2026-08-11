from __future__ import annotations

import json
from datetime import datetime
from uuid import uuid4

import psycopg

from app.core.db import get_psycopg_conninfo
from app.schemas.simulations import RecalledMemory, SimulationEpisode
from app.services.agent_llm_service import llm_generate_json, should_try_real_llm

MAX_MEMORIES_PER_STUDENT = 50


def _ensure_tables(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS app_student_life_memories (
                memory_id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                memory_text TEXT NOT NULL,
                keywords TEXT[] DEFAULT '{}',
                importance SMALLINT DEFAULT 5,
                episode_id TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                last_recalled_at TIMESTAMPTZ
            )
            """
        )
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_student_life_memories_student
            ON app_student_life_memories(student_id, importance DESC)
            """
        )


def retrieve_relevant_memories(
    student_id: str,
    limit: int = 3,
    context: str | None = None,
) -> list[RecalledMemory]:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return _mock_memories(student_id)

    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT memory_id, memory_text
                    FROM app_student_life_memories
                    WHERE student_id = %s
                    ORDER BY
                      CASE WHEN last_recalled_at IS NULL THEN 0
                           ELSE EXTRACT(EPOCH FROM (NOW() - last_recalled_at)) END DESC,
                      importance DESC,
                      created_at DESC
                    LIMIT %s
                    """,
                    (student_id, limit),
                )
                rows = cur.fetchall()
                if not rows:
                    return _mock_memories(student_id) if not context else []

                memory_ids = [r[0] for r in rows]
                cur.execute(
                    """
                    UPDATE app_student_life_memories
                    SET last_recalled_at = NOW()
                    WHERE memory_id = ANY(%s)
                    """,
                    (memory_ids,),
                )
                conn.commit()

                return [
                    RecalledMemory(memory_id=row[0], text=row[1], reflected_in_story=False)
                    for row in rows
                ]
    except Exception:
        return _mock_memories(student_id)


def _mock_memories(student_id: str) -> list[RecalledMemory]:
    return [
        RecalledMemory(
            memory_id=f"mock_{student_id}_1",
            text="你曾在团队合作中主动承担协调角色，获得同伴认可。",
            reflected_in_story=False,
        ),
    ]


def list_memories(student_id: str, limit: int = 20) -> list[dict]:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return [
            {
                "memory_id": f"mock_{student_id}_1",
                "memory_text": "你曾在团队合作中主动承担协调角色，获得同伴认可。",
                "keywords": ["协作", "领导力"],
                "importance": 7,
                "episode_id": None,
                "created_at": datetime.utcnow().isoformat(),
            }
        ]

    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT memory_id, memory_text, keywords, importance, episode_id, created_at
                    FROM app_student_life_memories
                    WHERE student_id = %s
                    ORDER BY importance DESC, created_at DESC
                    LIMIT %s
                    """,
                    (student_id, limit),
                )
                rows = cur.fetchall()
                return [
                    {
                        "memory_id": r[0],
                        "memory_text": r[1],
                        "keywords": list(r[2] or []),
                        "importance": r[3],
                        "episode_id": r[4],
                        "created_at": r[5].isoformat() if r[5] else None,
                    }
                    for r in rows
                ]
    except Exception:
        return []


def store_memory(
    student_id: str,
    memory_text: str,
    keywords: list[str] | None = None,
    importance: int = 5,
    episode_id: str | None = None,
) -> str:
    memory_id = f"mem_{uuid4().hex[:12]}"
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return memory_id

    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO app_student_life_memories (
                      memory_id, student_id, memory_text, keywords, importance, episode_id
                    ) VALUES (%s,%s,%s,%s,%s,%s)
                    """,
                    (memory_id, student_id, memory_text, keywords or [], importance, episode_id),
                )
                cur.execute(
                    """
                    SELECT memory_id FROM app_student_life_memories
                    WHERE student_id = %s
                    ORDER BY importance ASC, created_at ASC
                    """,
                    (student_id,),
                )
                all_ids = [r[0] for r in cur.fetchall()]
                if len(all_ids) > MAX_MEMORIES_PER_STUDENT:
                    to_delete = all_ids[: len(all_ids) - MAX_MEMORIES_PER_STUDENT]
                    cur.execute(
                        "DELETE FROM app_student_life_memories WHERE memory_id = ANY(%s)",
                        (to_delete,),
                    )
                conn.commit()
    except Exception:
        pass
    return memory_id


def delete_memory(memory_id: str) -> bool:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return True
    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute("DELETE FROM app_student_life_memories WHERE memory_id = %s", (memory_id,))
                conn.commit()
                return cur.rowcount > 0
    except Exception:
        return False


def _build_transcript(episode: SimulationEpisode) -> str:
    lines = [f"目标: {episode.target}", f"类型: {episode.simulation_type}"]
    for turn in episode.turns:
        lines.append(f"回合{turn.turn} 选择: {turn.choice}")
        lines.append(f"叙事: {turn.narrative[:200]}")
    if episode.ending:
        lines.append(f"结局: {episode.ending.title} - {episode.ending.summary}")
    return "\n".join(lines)


def record_episode_memories(episode: SimulationEpisode) -> list[str]:
    if episode.status != "completed":
        return []

    created: list[str] = []
    if should_try_real_llm():
        transcript = _build_transcript(episode)
        system_prompt = "你是记忆提炼助手。输出严格 JSON，不要 Markdown。"
        user_prompt = f"""
从以下模拟剧情中提取最多 3 条对未来决策有影响的个人经历记忆。
每条包含 text（一句话）、importance（1-10）、keywords（2-4 个中文词）。
输出 JSON: {{"memories": [{{"text":"...","importance":8,"keywords":["..."]}}]}}

剧情：
{transcript}
""".strip()
        payload, err = llm_generate_json(system_prompt, user_prompt, temperature=0.3)
        if payload and isinstance(payload.get("memories"), list):
            for item in payload["memories"][:3]:
                if not isinstance(item, dict) or not item.get("text"):
                    continue
                mid = store_memory(
                    student_id=episode.student_id,
                    memory_text=str(item["text"]),
                    keywords=[str(k) for k in (item.get("keywords") or [])][:4],
                    importance=int(item.get("importance", 5)),
                    episode_id=episode.episode_id,
                )
                created.append(mid)
            return created

    if episode.ending:
        mid = store_memory(
            student_id=episode.student_id,
            memory_text=f"在{episode.simulation_type}模拟中：{episode.ending.summary}",
            keywords=[episode.simulation_type, episode.ending.code[:12]],
            importance=7,
            episode_id=episode.episode_id,
        )
        created.append(mid)
    if episode.turns:
        last = episode.turns[-1]
        mid = store_memory(
            student_id=episode.student_id,
            memory_text=f"你在关键回合选择了：{last.choice[:80]}",
            keywords=["选择", episode.simulation_type],
            importance=6,
            episode_id=episode.episode_id,
        )
        created.append(mid)
    return created
