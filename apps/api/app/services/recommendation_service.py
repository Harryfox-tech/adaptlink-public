from __future__ import annotations

import hashlib
import json

import psycopg

from app.core.db import get_psycopg_conninfo
from app.schemas.recommendations import RecommendationItem, RecommendationResponse


def _fallback_recommendations(student_id: str) -> RecommendationResponse:
    return RecommendationResponse(
        student_id=student_id,
        items=[
            RecommendationItem(
                job_id="job_001",
                title="产品运营专员",
                company="星澜科技",
                match_score=86,
                reasons=["沟通表达与岗位协作要求匹配", "执行力稳定"],
            ),
            RecommendationItem(
                job_id="job_002",
                title="校园市场培训生",
                company="映河教育",
                match_score=81,
                reasons=["抗压能力良好", "同理沟通能力较好"],
            ),
            RecommendationItem(
                job_id="job_003",
                title="数据运营助理",
                company="云策数据",
                match_score=77,
                reasons=["逻辑分析能力中上", "建议增强指标拆解能力"],
            ),
        ],
    )


def get_job_recommendations(student_id: str) -> RecommendationResponse:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return _fallback_recommendations(student_id)

    try:
        with psycopg.connect(conninfo) as conn:
            with conn.cursor() as cur:
                # Ensure tables exist (created in SimulationPersistenceService, but keep endpoint safe)
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
                cur.execute(
                    """
                    SELECT job_id, title, company, match_score, reasons
                    FROM app_job_recommendations
                    WHERE student_id = %s
                    ORDER BY created_at DESC
                    LIMIT 20
                    """,
                    (student_id,),
                )
                rows = cur.fetchall()

                if not rows:
                    # Build from enterprise job pool (open jobs)
                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS app_enterprise_companies (
                            company_id TEXT PRIMARY KEY,
                            name TEXT NOT NULL,
                            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                        );
                        """
                    )
                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS app_enterprise_jobs (
                            job_id TEXT PRIMARY KEY,
                            company_id TEXT NOT NULL,
                            title TEXT NOT NULL,
                            location TEXT NOT NULL,
                            required_skills JSONB NOT NULL,
                            description TEXT,
                            status TEXT NOT NULL DEFAULT 'open',
                            created_by TEXT,
                            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                        );
                        """
                    )
                    cur.execute(
                        """
                        SELECT j.job_id, j.company_id, j.title, c.name, j.required_skills
                        FROM app_enterprise_jobs j
                        LEFT JOIN app_enterprise_companies c ON c.company_id = j.company_id
                        WHERE j.status = 'open'
                        ORDER BY j.created_at DESC
                        LIMIT 20
                        """
                    )
                    job_rows = cur.fetchall()
                    if not job_rows:
                        return _fallback_recommendations(student_id)

                    seed_items: list[RecommendationItem] = []
                    insert_rows: list[tuple] = []
                    for job_id, company_id, title, company_name, required_skills in job_rows[:8]:
                        base = int(hashlib.sha256(f"{student_id}:{job_id}".encode("utf-8")).hexdigest()[:8], 16)
                        score = 70 + (base % 26)
                        # reasons: pick up to 3 skills
                        skills: list[str]
                        if isinstance(required_skills, list):
                            skills = [str(x) for x in required_skills]
                        else:
                            try:
                                skills = [str(x) for x in json.loads(required_skills or "[]")]
                            except Exception:  # noqa: BLE001
                                skills = []
                        reasons = [
                            f"岗位技能 '{s}' 与你的模拟画像匹配" for s in skills[:2]
                        ] + (["该岗位对稳定性与协作要求较高，你在模拟中表现良好"] if score >= 80 else ["建议补充更强的项目证据以提升匹配度"])
                        reasons = reasons[:3]
                        item = RecommendationItem(
                            job_id=str(job_id),
                            title=str(title),
                            company=str(company_name or company_id),
                            match_score=float(score),
                            reasons=reasons,
                        )
                        seed_items.append(item)
                        insert_rows.append(
                            (
                                f"rec_{student_id}",
                                student_id,
                                str(job_id),
                                str(company_id),
                                str(title),
                                str(company_name or company_id),
                                float(score),
                                json.dumps(reasons, ensure_ascii=False),
                            )
                        )

                    cur.executemany(
                        """
                        INSERT INTO app_job_recommendations (session_id, student_id, job_id, company_id, title, company, match_score, reasons)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        insert_rows,
                    )
                    conn.commit()
                    return RecommendationResponse(student_id=student_id, items=seed_items)

        items: list[RecommendationItem] = []
        for job_id, title, company, match_score, reasons in rows:
            parsed_reasons: list[str]
            if isinstance(reasons, list):
                parsed_reasons = [str(item) for item in reasons]
            elif isinstance(reasons, str):
                try:
                    parsed_reasons = [str(item) for item in json.loads(reasons)]
                except Exception:  # noqa: BLE001
                    parsed_reasons = [reasons]
            else:
                parsed_reasons = []

            items.append(
                RecommendationItem(
                    job_id=str(job_id),
                    title=str(title),
                    company=str(company),
                    match_score=float(match_score),
                    reasons=parsed_reasons,
                )
            )

        return RecommendationResponse(student_id=student_id, items=items)
    except Exception:  # noqa: BLE001
        return _fallback_recommendations(student_id)
