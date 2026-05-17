from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime

import psycopg

from app.core.db import get_psycopg_conninfo
from app.schemas.common import AbilityDimension, AgentReview
from app.schemas.simulations import (
    JobRecommendation,
    SimulationAggregate,
    SimulationHistoryItem,
    SimulationHistoryResponse,
    SimulationStartRequest,
)


@dataclass
class SimulationPersistenceResult:
    saved: bool
    reason: str | None = None


class SimulationPersistenceService:
    def __init__(self) -> None:
        self._initialized = False
        self._last_connect_error: str | None = None

    def _get_connection(self):
        conninfo = get_psycopg_conninfo()
        if not conninfo:
            self._last_connect_error = "DATABASE_URL missing"
            return None
        try:
            self._last_connect_error = None
            return psycopg.connect(conninfo)
        except Exception as exc:  # noqa: BLE001
            self._last_connect_error = str(exc)
            return None

    def _ensure_tables(self, conn: psycopg.Connection) -> None:
        if self._initialized:
            return

        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS app_simulation_sessions (
                    session_id TEXT PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    simulation_type TEXT NOT NULL,
                    scene TEXT NOT NULL,
                    target_job TEXT,
                    overall_score DOUBLE PRECISION NOT NULL,
                    summary TEXT NOT NULL,
                    recommendations JSONB NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS app_simulation_messages (
                    id BIGSERIAL PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS app_agent_reviews (
                    id BIGSERIAL PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    agent_name TEXT NOT NULL,
                    score DOUBLE PRECISION NOT NULL,
                    summary TEXT NOT NULL,
                    highlights JSONB NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS app_ability_snapshots (
                    id BIGSERIAL PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    student_id TEXT NOT NULL,
                    ability_key TEXT NOT NULL,
                    ability_label TEXT NOT NULL,
                    score DOUBLE PRECISION NOT NULL,
                    trend TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS app_job_recommendations (
                    id BIGSERIAL PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    student_id TEXT NOT NULL,
                    job_id TEXT NOT NULL,
                    company_id TEXT,
                    title TEXT NOT NULL,
                    company TEXT NOT NULL,
                    match_score DOUBLE PRECISION NOT NULL,
                    reasons JSONB NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            cur.execute("ALTER TABLE app_job_recommendations ADD COLUMN IF NOT EXISTS company_id TEXT;")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_job_recs_student ON app_job_recommendations(student_id);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_job_recs_company ON app_job_recommendations(company_id);")

        conn.commit()
        self._initialized = True

    def save_simulation(self, request: SimulationStartRequest, aggregate: SimulationAggregate) -> SimulationPersistenceResult:
        conn = self._get_connection()
        if conn is None:
            return SimulationPersistenceResult(saved=False, reason=self._last_connect_error or "DB connection unavailable")

        try:
            self._ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO app_simulation_sessions (
                        session_id, student_id, simulation_type, scene, target_job,
                        overall_score, summary, recommendations
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        aggregate.session_id,
                        request.student_id,
                        request.simulation_type,
                        request.scene,
                        request.target_job,
                        aggregate.overall_score,
                        aggregate.summary,
                        json.dumps(aggregate.recommendations, ensure_ascii=False),
                    ),
                )

                if request.messages:
                    cur.executemany(
                        """
                        INSERT INTO app_simulation_messages (session_id, role, content, timestamp)
                        VALUES (%s, %s, %s, %s)
                        """,
                        [(aggregate.session_id, msg.role, msg.content, msg.timestamp) for msg in request.messages],
                    )

                cur.executemany(
                    """
                    INSERT INTO app_agent_reviews (session_id, agent_name, score, summary, highlights)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    [
                        (
                            aggregate.session_id,
                            review.agent,
                            review.score,
                            review.summary,
                            json.dumps(review.highlights, ensure_ascii=False),
                        )
                        for review in aggregate.agent_reviews
                    ],
                )

                cur.executemany(
                    """
                    INSERT INTO app_ability_snapshots (
                        session_id, student_id, ability_key, ability_label, score, trend
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    [
                        (aggregate.session_id, request.student_id, ability.key, ability.label, ability.score, ability.trend)
                        for ability in aggregate.ability_scores
                    ],
                )

                if aggregate.job_recommendations:
                    cur.executemany(
                        """
                        INSERT INTO app_job_recommendations (
                            session_id, student_id, job_id, title, company, match_score, reasons
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            (
                                aggregate.session_id,
                                request.student_id,
                                rec.job_id,
                                rec.title,
                                rec.company,
                                rec.match_score,
                                json.dumps(rec.reasons, ensure_ascii=False),
                            )
                            for rec in aggregate.job_recommendations
                        ],
                    )

            conn.commit()
            return SimulationPersistenceResult(saved=True)
        except Exception as exc:  # noqa: BLE001
            conn.rollback()
            return SimulationPersistenceResult(saved=False, reason=str(exc))
        finally:
            conn.close()

    def get_latest_simulation(self, student_id: str, simulation_type: str) -> SimulationAggregate | None:
        conn = self._get_connection()
        if conn is None:
            return None

        try:
            self._ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT session_id, overall_score, summary, recommendations
                    FROM app_simulation_sessions
                    WHERE student_id = %s AND simulation_type = %s
                    ORDER BY created_at DESC
                    LIMIT 1
                    """,
                    (student_id, simulation_type),
                )
                row = cur.fetchone()
                if not row:
                    return None

                session_id, overall_score, summary, recommendations = row

                cur.execute(
                    """
                    SELECT ability_key, ability_label, score, trend
                    FROM app_ability_snapshots
                    WHERE session_id = %s
                    ORDER BY id ASC
                    """,
                    (session_id,),
                )
                ability_rows = cur.fetchall()

                cur.execute(
                    """
                    SELECT agent_name, score, summary, highlights
                    FROM app_agent_reviews
                    WHERE session_id = %s
                    ORDER BY id ASC
                    """,
                    (session_id,),
                )
                review_rows = cur.fetchall()

                cur.execute(
                    """
                    SELECT job_id, title, company, match_score, reasons
                    FROM app_job_recommendations
                    WHERE session_id = %s
                    ORDER BY id ASC
                    """,
                    (session_id,),
                )
                recommendation_rows = cur.fetchall()

            ability_scores = [
                AbilityDimension(key=key, label=label, score=float(score), trend=trend)
                for key, label, score, trend in ability_rows
            ]
            agent_reviews = [
                AgentReview(
                    agent=agent_name,
                    score=float(score),
                    summary=review_summary,
                    highlights=highlights if isinstance(highlights, list) else json.loads(highlights),
                )
                for agent_name, score, review_summary, highlights in review_rows
            ]
            job_recommendations = [
                JobRecommendation(
                    job_id=job_id,
                    title=title,
                    company=company,
                    match_score=float(match_score),
                    reasons=reasons if isinstance(reasons, list) else json.loads(reasons),
                )
                for job_id, title, company, match_score, reasons in recommendation_rows
            ]

            return SimulationAggregate(
                session_id=session_id,
                simulation_type=simulation_type,
                overall_score=float(overall_score),
                summary=summary,
                recommendations=recommendations if isinstance(recommendations, list) else json.loads(recommendations),
                ability_scores=ability_scores,
                agent_reviews=agent_reviews,
                job_recommendations=job_recommendations,
            )
        except Exception:
            return None
        finally:
            conn.close()

    def get_simulation_history(self, student_id: str, limit: int = 20) -> SimulationHistoryResponse | None:
        conn = self._get_connection()
        if conn is None:
            return None

        try:
            self._ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT session_id, simulation_type, scene, overall_score, summary, created_at
                    FROM app_simulation_sessions
                    WHERE student_id = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (student_id, limit),
                )
                rows = cur.fetchall()

            items = [
                SimulationHistoryItem(
                    session_id=row[0],
                    simulation_type=row[1],
                    scene=row[2],
                    overall_score=float(row[3]),
                    summary=row[4],
                    created_at=(row[5].isoformat() if isinstance(row[5], datetime) else str(row[5])),
                )
                for row in rows
            ]
            return SimulationHistoryResponse(student_id=student_id, items=items)
        except Exception:
            return None
        finally:
            conn.close()


simulation_persistence_service = SimulationPersistenceService()
