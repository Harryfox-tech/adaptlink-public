from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta

import psycopg

from app.core.db import get_psycopg_conninfo
from app.schemas.enterprise import (
    AnalyticsChannelItem,
    AnalyticsSchoolHeatItem,
    CandidateAbilitySnapshot,
    CandidateDetailResponse,
    CandidateListItem,
    CandidateRecommendation,
    CandidateSimulationSummary,
    EnterpriseDashboardResponse,
    EnterpriseFunnelItem,
    EnterpriseJobModelActionResponse,
    EnterpriseJobModelGenerateRequest,
    EnterpriseJobModelSaveRequest,
    EnterpriseJobsCenterResponse,
    EnterpriseMetricItem,
    EnterpriseAnalyticsResponse,
    EnterpriseAnalyticsFilterRequest,
    EnterprisePartnershipsResponse,
    EnterprisePartnershipQueryRequest,
    EnterpriseRecruitmentResponse,
    EnterpriseRecruitmentFeedbackRequest,
    EnterpriseRecruitmentFeedbackResponse,
    EnterpriseSettingsResponse,
    EnterpriseSettingsUpdateRequest,
    EnterpriseSettingsUpdateResponse,
    EnterpriseWarningItem,
    GovernanceRuleItem,
    InterviewTemplateItem,
    Job,
    JobTemplateItem,
    PartnershipActivityItem,
    PartnershipSchoolItem,
    RecruitmentFlowItem,
    RolePermissionItem,
    TalentPoolResponse,
)
from app.services.agent_llm_service import llm_generate_json, should_try_real_llm
from app.services.application_service import get_enterprise_application_packages


def _ensure_catalog_tables(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
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
        cur.execute("CREATE INDEX IF NOT EXISTS idx_enterprise_jobs_company ON app_enterprise_jobs(company_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_enterprise_jobs_status ON app_enterprise_jobs(status);")
    conn.commit()


def _seed_demo_jobs(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(1) FROM app_enterprise_jobs;")
        row = cur.fetchone()
        count = int(row[0]) if row else 0
        if count > 0:
            return
        demo = [
            ("job_001", "c_001", "产品运营专员", "上海", ["沟通表达", "数据分析", "项目协同"], "负责增长活动与用户运营。"),
            ("job_002", "c_002", "校园市场培训生", "杭州", ["活动策划", "沟通协调", "执行推进"], "负责校园市场拓展与品牌活动支持。"),
        ]
        # Ensure demo companies exist
        cur.execute(
            "INSERT INTO app_enterprise_companies (company_id, name) VALUES (%s, %s) ON CONFLICT (company_id) DO NOTHING",
            ("c_001", "星澜科技"),
        )
        cur.execute(
            "INSERT INTO app_enterprise_companies (company_id, name) VALUES (%s, %s) ON CONFLICT (company_id) DO NOTHING",
            ("c_002", "映河教育"),
        )
        cur.executemany(
            """
            INSERT INTO app_enterprise_jobs (job_id, company_id, title, location, required_skills, description, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'open')
            ON CONFLICT (job_id) DO NOTHING
            """,
            [(j, c, t, l, json.dumps(skills, ensure_ascii=False), d) for (j, c, t, l, skills, d) in demo],
        )
    conn.commit()


def list_jobs(company_id: str | None = None) -> list[Job]:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        # fallback static
        jobs = [
            Job(
                job_id="job_001",
                company_id="c_001",
                title="产品运营专员",
                location="上海",
                required_skills=["沟通表达", "数据分析", "项目协同"],
                description="负责增长活动与用户运营。",
            ),
            Job(
                job_id="job_002",
                company_id="c_002",
                title="校园市场培训生",
                location="杭州",
                required_skills=["活动策划", "沟通协调", "执行推进"],
                description="负责校园市场拓展与品牌活动支持。",
            ),
        ]
        return [j for j in jobs if (company_id is None or j.company_id == company_id)]

    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_catalog_tables(conn)
            _seed_demo_jobs(conn)
            with conn.cursor() as cur:
                if company_id:
                    cur.execute(
                        """
                        SELECT job_id, company_id, title, location, required_skills, description
                        FROM app_enterprise_jobs
                        WHERE company_id = %s AND status = 'open'
                        ORDER BY created_at DESC
                        """,
                        (company_id,),
                    )
                else:
                    cur.execute(
                        """
                        SELECT job_id, company_id, title, location, required_skills, description
                        FROM app_enterprise_jobs
                        WHERE status = 'open'
                        ORDER BY created_at DESC
                        """
                    )
                rows = cur.fetchall()
        items: list[Job] = []
        for job_id, cid, title, location, required_skills, description in rows:
            skills: list[str]
            if isinstance(required_skills, list):
                skills = [str(x) for x in required_skills]
            else:
                try:
                    skills = [str(x) for x in json.loads(required_skills or "[]")]
                except Exception:  # noqa: BLE001
                    skills = []
            items.append(
                Job(
                    job_id=str(job_id),
                    company_id=str(cid),
                    title=str(title),
                    location=str(location),
                    required_skills=skills,
                    description=str(description) if description is not None else None,
                )
            )
        return items
    except Exception:  # noqa: BLE001
        return []


def create_job(company_id: str, created_by: str | None, payload: dict) -> Job:
    job_id = payload.get("job_id") or f"job_{uuid.uuid4().hex[:8]}"
    title = str(payload.get("title") or "").strip()
    location = str(payload.get("location") or "").strip()
    required_skills = payload.get("required_skills") or []
    description = payload.get("description")
    if not title or not location:
        raise ValueError("title/location 不能为空")

    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return Job(
            job_id=job_id,
            company_id=company_id,
            title=title,
            location=location,
            required_skills=[str(x) for x in required_skills],
            description=str(description) if description else None,
        )

    with psycopg.connect(conninfo) as conn:
        _ensure_catalog_tables(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO app_enterprise_jobs (job_id, company_id, title, location, required_skills, description, status, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, 'open', %s)
                ON CONFLICT (job_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    location = EXCLUDED.location,
                    required_skills = EXCLUDED.required_skills,
                    description = EXCLUDED.description,
                    updated_at = NOW()
                """,
                (
                    job_id,
                    company_id,
                    title,
                    location,
                    json.dumps(required_skills, ensure_ascii=False),
                    description,
                    created_by,
                ),
            )
        conn.commit()

    return Job(
        job_id=job_id,
        company_id=company_id,
        title=title,
        location=location,
        required_skills=[str(x) for x in required_skills],
        description=str(description) if description else None,
    )


def _risk_level(score: float) -> str:
    if score >= 80:
        return "low"
    if score >= 65:
        return "medium"
    return "high"


def _fallback_talent_pool() -> TalentPoolResponse:
    return TalentPoolResponse(items=[])


def _fallback_candidate_detail(student_id: str, company_id: str | None = None) -> CandidateDetailResponse:
    return CandidateDetailResponse(
        student_id=student_id,
        name=f"候选人 {student_id}",
        major="",
        grade="",
        overall_score=0,
        strengths=[],
        risk_flags=[],
        latest_simulations=[],
        ability_snapshot=[],
        recommendations=[],
        application_packages=get_enterprise_application_packages(student_id, company_id=company_id),
    )


def _filter_talent_pool(
    items: list[CandidateListItem],
    keyword: str | None,
    risk_level: str | None,
    min_score: float | None,
) -> TalentPoolResponse:
    filtered = items

    if keyword:
        k = keyword.strip().lower()
        filtered = [item for item in filtered if k in item.student_id.lower() or k in item.name.lower()]

    if risk_level:
        filtered = [item for item in filtered if item.risk_level == risk_level]

    if min_score is not None:
        filtered = [item for item in filtered if item.overall_score >= min_score]

    return TalentPoolResponse(items=filtered)


def list_talent_pool(keyword: str | None, risk_level: str | None, min_score: float | None) -> TalentPoolResponse:
    conninfo = get_psycopg_conninfo()

    if not conninfo:
        return _filter_talent_pool(_fallback_talent_pool().items, keyword, risk_level, min_score)

    try:
        with psycopg.connect(conninfo) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT s.student_id, s.session_id, s.simulation_type, s.overall_score
                    FROM app_simulation_sessions s
                    JOIN (
                      SELECT student_id, MAX(created_at) AS max_created
                      FROM app_simulation_sessions
                      GROUP BY student_id
                    ) latest
                      ON s.student_id = latest.student_id AND s.created_at = latest.max_created
                    ORDER BY s.created_at DESC
                    """
                )
                latest_rows = cur.fetchall()

                if not latest_rows:
                    return _filter_talent_pool(_fallback_talent_pool().items, keyword, risk_level, min_score)

                items: list[CandidateListItem] = []
                for student_id, session_id, simulation_type, overall_score in latest_rows:
                    cur.execute(
                        """
                        SELECT ability_label, score
                        FROM app_ability_snapshots
                        WHERE session_id = %s
                        ORDER BY score DESC
                        LIMIT 3
                        """,
                        (session_id,),
                    )
                    strength_rows = cur.fetchall()

                    cur.execute(
                        """
                        SELECT title, company, match_score
                        FROM app_job_recommendations
                        WHERE student_id = %s
                        ORDER BY created_at DESC
                        LIMIT 1
                        """,
                        (student_id,),
                    )
                    recommendation_row = cur.fetchone()

                    items.append(
                        CandidateListItem(
                            student_id=student_id,
                            name=f"候选人 {student_id}",
                            major="信息管理与信息系统",
                            grade="2023级",
                            overall_score=float(overall_score),
                            risk_level=_risk_level(float(overall_score)),
                            strengths=[row[0] for row in strength_rows],
                            latest_simulation_type=simulation_type,
                            latest_recommendation_title=(recommendation_row[0] if recommendation_row else None),
                            latest_recommendation_company=(recommendation_row[1] if recommendation_row else None),
                            latest_recommendation_score=(float(recommendation_row[2]) if recommendation_row else None),
                        )
                    )

        return _filter_talent_pool(items, keyword, risk_level, min_score)
    except Exception:  # noqa: BLE001
        return _filter_talent_pool(_fallback_talent_pool().items, keyword, risk_level, min_score)


def get_candidate_detail(student_id: str, company_id: str | None = None) -> CandidateDetailResponse:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return _fallback_candidate_detail(student_id, company_id=company_id)

    try:
        with psycopg.connect(conninfo) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT session_id, simulation_type, overall_score, summary, created_at
                    FROM app_simulation_sessions
                    WHERE student_id = %s
                    ORDER BY created_at DESC
                    LIMIT 5
                    """,
                    (student_id,),
                )
                simulation_rows = cur.fetchall()

                if not simulation_rows:
                    return _fallback_candidate_detail(student_id, company_id=company_id)

                latest_session_id = simulation_rows[0][0]
                latest_overall_score = float(simulation_rows[0][2])

                cur.execute(
                    """
                    SELECT ability_key, ability_label, score, trend
                    FROM app_ability_snapshots
                    WHERE session_id = %s
                    ORDER BY id ASC
                    """,
                    (latest_session_id,),
                )
                ability_rows = cur.fetchall()

                cur.execute(
                    """
                    SELECT job_id, title, company, match_score
                    FROM app_job_recommendations
                    WHERE student_id = %s
                    ORDER BY created_at DESC
                    LIMIT 5
                    """,
                    (student_id,),
                )
                recommendation_rows = cur.fetchall()

        latest_simulations = [
            CandidateSimulationSummary(
                session_id=row[0],
                simulation_type=row[1],
                overall_score=float(row[2]),
                summary=row[3],
                created_at=(row[4].isoformat() if isinstance(row[4], datetime) else str(row[4])),
            )
            for row in simulation_rows
        ]

        ability_snapshot = [
            CandidateAbilitySnapshot(
                ability_key=row[0],
                ability_label=row[1],
                score=float(row[2]),
                trend=row[3],
            )
            for row in ability_rows
        ]

        recommendations = [
            CandidateRecommendation(
                job_id=row[0],
                title=row[1],
                company=row[2],
                match_score=float(row[3]),
            )
            for row in recommendation_rows
        ]

        strengths = [item.ability_label for item in sorted(ability_snapshot, key=lambda x: x.score, reverse=True)[:3]]
        risk_flags = [item.ability_label for item in sorted(ability_snapshot, key=lambda x: x.score)[:2]]

        return CandidateDetailResponse(
            student_id=student_id,
            name="候选人 " + student_id,
            major="信息管理与信息系统",
            grade="2023级",
            overall_score=latest_overall_score,
            strengths=strengths,
            risk_flags=risk_flags,
            latest_simulations=latest_simulations,
            ability_snapshot=ability_snapshot,
            recommendations=recommendations,
            application_packages=get_enterprise_application_packages(student_id, company_id=company_id),
        )
    except Exception:  # noqa: BLE001
        return _fallback_candidate_detail(student_id, company_id=company_id)


def _enterprise_snapshot() -> dict | None:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return None

    try:
        with psycopg.connect(conninfo) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(DISTINCT student_id) FROM app_simulation_sessions")
                candidate_pool = int(cur.fetchone()[0] or 0)

                cur.execute(
                    """
                    SELECT COUNT(*)
                    FROM app_simulation_sessions
                    WHERE created_at >= %s
                    """,
                    (datetime.utcnow() - timedelta(days=30),),
                )
                monthly_sessions = int(cur.fetchone()[0] or 0)

                cur.execute(
                    """
                    SELECT COUNT(*)
                    FROM (
                        SELECT student_id, MAX(created_at) AS max_created
                        FROM app_simulation_sessions
                        GROUP BY student_id
                    ) latest
                    JOIN app_simulation_sessions s
                      ON s.student_id = latest.student_id
                     AND s.created_at = latest.max_created
                    WHERE s.overall_score >= 70
                    """
                )
                passed_latest = int(cur.fetchone()[0] or 0)

                cur.execute("SELECT COUNT(*) FROM app_job_recommendations")
                recommendation_count = int(cur.fetchone()[0] or 0)

                cur.execute("SELECT COUNT(DISTINCT company) FROM app_job_recommendations")
                partner_companies = int(cur.fetchone()[0] or 0)

                cur.execute(
                    """
                    SELECT COALESCE(AVG(match_score), 0)
                    FROM app_job_recommendations
                    """
                )
                avg_match = float(cur.fetchone()[0] or 0)

                cur.execute(
                    """
                    SELECT target_job, COUNT(*) AS cnt
                    FROM app_simulation_sessions
                    WHERE target_job IS NOT NULL AND target_job <> ''
                    GROUP BY target_job
                    ORDER BY cnt DESC
                    LIMIT 3
                    """
                )
                top_jobs = cur.fetchall()

                cur.execute(
                    """
                    SELECT ability_label, AVG(score) AS avg_score
                    FROM app_ability_snapshots
                    GROUP BY ability_label
                    ORDER BY avg_score ASC
                    LIMIT 5
                    """
                )
                low_abilities = cur.fetchall()

                cur.execute(
                    """
                    SELECT ability_label, AVG(score) AS avg_score
                    FROM app_ability_snapshots
                    GROUP BY ability_label
                    ORDER BY avg_score ASC
                    LIMIT 3
                    """
                )
                weakest_three = cur.fetchall()

                cur.execute("SELECT to_regclass('public.app_student_applications')")
                has_applications = bool(cur.fetchone()[0])

                interviewing_count = 0
                offer_count = 0
                if has_applications:
                    cur.execute(
                        """
                        SELECT
                          SUM(CASE WHEN status IN ('面试中', '已约面试', 'interviewing') THEN 1 ELSE 0 END) AS interviewing,
                          SUM(CASE WHEN status IN ('已录用', 'offer', 'offered') THEN 1 ELSE 0 END) AS offered
                        FROM app_student_applications
                        """
                    )
                    row = cur.fetchone()
                    interviewing_count = int((row[0] or 0) if row else 0)
                    offer_count = int((row[1] or 0) if row else 0)

                cur.execute(
                    """
                    SELECT company, COUNT(*) AS cnt, AVG(match_score) AS avg_fit
                    FROM app_job_recommendations
                    GROUP BY company
                    ORDER BY cnt DESC
                    LIMIT 3
                    """
                )
                top_companies = cur.fetchall()

                cur.execute(
                    """
                    SELECT simulation_type, COUNT(*)
                    FROM app_simulation_sessions
                    GROUP BY simulation_type
                    """
                )
                simulation_types = cur.fetchall()

        return {
            "candidate_pool": candidate_pool,
            "monthly_sessions": monthly_sessions,
            "passed_latest": passed_latest,
            "recommendation_count": recommendation_count,
            "partner_companies": partner_companies,
            "avg_match": avg_match,
            "top_jobs": top_jobs,
            "low_abilities": low_abilities,
            "weakest_three": weakest_three,
            "interviewing_count": interviewing_count,
            "offer_count": offer_count,
            "top_companies": top_companies,
            "simulation_types": simulation_types,
        }
    except Exception:  # noqa: BLE001
        return None


def _school_bucket(student_id: str) -> str:
    labels = ["华东理工大学", "岭南财经大学", "北方信息学院", "江南科技学院", "东海应用大学"]
    idx = sum(ord(ch) for ch in student_id) % len(labels)
    return labels[idx]


def get_enterprise_dashboard() -> EnterpriseDashboardResponse:
    snapshot = _enterprise_snapshot()
    if snapshot:
        pool = snapshot["candidate_pool"]
        pass_rate = int(round((snapshot["passed_latest"] / pool) * 100)) if pool else 0
        in_flow = max(snapshot["interviewing_count"], int(snapshot["recommendation_count"] * 0.3))
        warnings: list[EnterpriseWarningItem] = []
        if pass_rate < 35:
            warnings.append(EnterpriseWarningItem(message="Latest screening pass rate is below 35%; review model thresholds."))
        if snapshot["partner_companies"] < 5:
            warnings.append(EnterpriseWarningItem(message="Partner-company diversity is low; expand cooperative channels."))
        if snapshot["avg_match"] < 72:
            warnings.append(EnterpriseWarningItem(message="Average match score is below target; refine role templates and calibration."))
        if not warnings:
            warnings.append(EnterpriseWarningItem(message="Core funnel metrics are stable; keep weekly quality review cadence."))

        gap_words = [row[0] for row in snapshot["low_abilities"] if row and row[0]]
        if not gap_words:
            gap_words = ["Business understanding", "Data expression", "Cross-team collaboration"]

        return EnterpriseDashboardResponse(
            metrics=[
                EnterpriseMetricItem(
                    title="本月新增岗位",
                    value=str(len(snapshot["top_jobs"])),
                    delta=f"+{snapshot['monthly_sessions']}",
                    hint="From latest simulation demand signal",
                ),
                EnterpriseMetricItem(
                    title="候选人入库",
                    value=str(pool),
                    delta=f"+{snapshot['recommendation_count']}",
                    hint="Distinct students with simulation records",
                ),
                EnterpriseMetricItem(
                    title="初筛通过率",
                    value=f"{pass_rate}%",
                    delta=f"{int(round(snapshot['avg_match']))} avg",
                    hint="Based on latest score >= 70 and recommendation fit",
                ),
                EnterpriseMetricItem(
                    title="在招流程中",
                    value=str(in_flow),
                    delta=f"+{snapshot['offer_count']}",
                    hint="Interviewing and offer-stage workload",
                ),
            ],
            warnings=warnings[:3],
            funnel=[
                EnterpriseFunnelItem(stage="投递", value=max(pool, snapshot["recommendation_count"])),
                EnterpriseFunnelItem(stage="TAI 初筛通过", value=snapshot["passed_latest"]),
                EnterpriseFunnelItem(stage="面试中", value=in_flow),
                EnterpriseFunnelItem(stage="Offer", value=snapshot["offer_count"]),
            ],
            gap_words=gap_words,
        )

    return EnterpriseDashboardResponse(
        metrics=[
            EnterpriseMetricItem(title="本月新增岗位", value="0", delta="+0", hint="等待真实数据"),
            EnterpriseMetricItem(title="候选人入库", value="0", delta="+0", hint="等待真实数据"),
            EnterpriseMetricItem(title="初筛通过率", value="0%", delta="+0", hint="等待真实数据"),
            EnterpriseMetricItem(title="在招流程中", value="0", delta="+0", hint="等待真实数据"),
        ],
        warnings=[EnterpriseWarningItem(message="当前暂无可用招聘数据，请先完成数据接入。")],
        funnel=[
            EnterpriseFunnelItem(stage="投递", value=0),
            EnterpriseFunnelItem(stage="TAI 初筛通过", value=0),
            EnterpriseFunnelItem(stage="面试中", value=0),
            EnterpriseFunnelItem(stage="Offer", value=0),
        ],
        gap_words=[],
    )


def get_enterprise_jobs_center() -> EnterpriseJobsCenterResponse:
    snapshot = _enterprise_snapshot()
    if snapshot:
        templates = [
            JobTemplateItem(name=row[0], dept="业务部门", use_count=f"{int(row[1])} 次")
            for row in snapshot["top_jobs"]
            if row and row[0]
        ]

        weakest = snapshot["weakest_three"]
        raw_weights = {row[0]: max(1.0, 100.0 - float(row[1])) for row in weakest if row and row[0]}
        weight_total = sum(raw_weights.values())
        normalized = (
            {k: round(v / weight_total, 2) for k, v in raw_weights.items()}
            if weight_total > 0
            else {"业务理解": 0.34, "数据分析": 0.33, "沟通表达": 0.33}
        )
        required = list(normalized.keys())[:3]

        if templates:
            return EnterpriseJobsCenterResponse(
                templates=templates,
                default_weights=normalized,
                default_required_skills=required,
            )

    return EnterpriseJobsCenterResponse(
        templates=[],
        default_weights={},
        default_required_skills=[],
    )


def _normalize_weights(weight_map: dict[str, float]) -> dict[str, float]:
    cleaned: dict[str, float] = {}
    for key, value in weight_map.items():
        label = str(key).strip()
        if not label:
            continue
        try:
            number = max(0.01, float(value))
        except Exception:  # noqa: BLE001
            continue
        cleaned[label] = number

    if not cleaned:
        cleaned = {"业务理解": 0.3, "数据分析": 0.3, "沟通表达": 0.2, "执行推进": 0.2}

    total = sum(cleaned.values()) or 1.0
    return {k: round(v / total, 2) for k, v in cleaned.items()}


def _fallback_job_model(payload: EnterpriseJobModelGenerateRequest) -> tuple[dict[str, float], list[str], str, list[str], str]:
    required = [item.strip() for item in payload.required_skills if item.strip()]
    if not required:
        required = ["业务理解", "沟通表达", "执行推进"]

    weights = payload.weight_hints if payload.weight_hints else {item: 1.0 for item in required[:4]}
    normalized = _normalize_weights(weights)
    summary = f"基于岗位描述已生成能力模型，建议围绕 {', '.join(list(normalized.keys())[:3])} 设置分层评价。"
    questions = [
        f"请分享一个体现“{list(normalized.keys())[0]}”的真实项目场景。",
        "在目标冲突或资源受限时，你如何做优先级判断？",
        "你会如何在入职前90天验证岗位关键目标是否达成？",
    ]
    return normalized, required, summary, questions, "mock"


def _generate_job_model(payload: EnterpriseJobModelGenerateRequest) -> tuple[dict[str, float], list[str], str, list[str], str]:
    if should_try_real_llm():
        system_prompt = (
            "你是企业招聘建模顾问。请输出严格 JSON，不要输出 Markdown。"
            "weights 的值为数字；required_skills 和 interview_questions 为字符串数组。"
        )
        user_prompt = (
            f"岗位名称: {payload.job_name}\n"
            f"部门: {payload.department}\n"
            f"职级: {payload.level}\n"
            f"工作方式: {payload.work_mode}\n"
            f"已有必备能力: {json.dumps(payload.required_skills, ensure_ascii=False)}\n"
            f"已有权重提示: {json.dumps(payload.weight_hints, ensure_ascii=False)}\n"
            f"岗位描述: {payload.description}\n\n"
            "返回 JSON:\n"
            "{\n"
            '  "weights": {"能力A": 0.3, "能力B": 0.2},\n'
            '  "required_skills": ["能力A", "能力B"],\n'
            '  "summary": "string",\n'
            '  "interview_questions": ["string", "string", "string"]\n'
            "}"
        )
        llm_json, llm_error = llm_generate_json(system_prompt=system_prompt, user_prompt=user_prompt, temperature=0.2)
        if isinstance(llm_json, dict):
            raw_weights = llm_json.get("weights", {})
            raw_skills = llm_json.get("required_skills", [])
            raw_summary = llm_json.get("summary", "")
            raw_questions = llm_json.get("interview_questions", [])
            normalized = _normalize_weights(raw_weights if isinstance(raw_weights, dict) else {})
            required = [str(item).strip() for item in raw_skills if str(item).strip()]
            if not required:
                required = list(normalized.keys())[:3]
            questions = [str(item).strip() for item in raw_questions if str(item).strip()][:5]
            if not questions:
                questions = [
                    f"请举例说明你如何体现“{required[0]}”。",
                    "你如何处理跨团队协作中的分歧？",
                    "面对目标变化，你会怎样调整执行方案？",
                ]
            summary = str(raw_summary).strip() or "已基于岗位信息完成 AI 能力建模。"
            return normalized, required, summary, questions, "openai"
        if llm_error:
            pass

    return _fallback_job_model(payload)


def _save_job_model(
    model_id: str,
    job_name: str,
    department: str,
    level: str,
    work_mode: str,
    required_skills: list[str],
    weights: dict[str, float],
    summary: str,
    interview_questions: list[str],
    engine: str,
) -> bool:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return False

    try:
        with psycopg.connect(conninfo) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS app_enterprise_job_models (
                        model_id TEXT PRIMARY KEY,
                        job_name TEXT NOT NULL,
                        department TEXT NOT NULL,
                        level TEXT NOT NULL,
                        work_mode TEXT NOT NULL,
                        required_skills_json TEXT NOT NULL,
                        weights_json TEXT NOT NULL,
                        summary TEXT NOT NULL,
                        interview_questions_json TEXT NOT NULL,
                        engine TEXT NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
                cur.execute(
                    """
                    INSERT INTO app_enterprise_job_models (
                        model_id, job_name, department, level, work_mode,
                        required_skills_json, weights_json, summary, interview_questions_json, engine
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        model_id,
                        job_name,
                        department,
                        level,
                        work_mode,
                        json.dumps(required_skills, ensure_ascii=False),
                        json.dumps(weights, ensure_ascii=False),
                        summary,
                        json.dumps(interview_questions, ensure_ascii=False),
                        engine,
                    ),
                )
            conn.commit()
        return True
    except Exception:  # noqa: BLE001
        return False


def generate_enterprise_job_model(payload: EnterpriseJobModelGenerateRequest) -> EnterpriseJobModelActionResponse:
    normalized, required, summary, interview_questions, engine = _generate_job_model(payload)
    model_id = f"job_model_{uuid.uuid4().hex[:12]}"
    saved = _save_job_model(
        model_id=model_id,
        job_name=payload.job_name.strip() or "未命名岗位",
        department=payload.department.strip() or "未分配部门",
        level=payload.level.strip() or "未定义",
        work_mode=payload.work_mode.strip() or "未定义",
        required_skills=required,
        weights=normalized,
        summary=summary,
        interview_questions=interview_questions,
        engine=engine,
    )
    return EnterpriseJobModelActionResponse(
        model_id=model_id,
        job_name=payload.job_name.strip() or "未命名岗位",
        department=payload.department.strip() or "未分配部门",
        level=payload.level.strip() or "未定义",
        work_mode=payload.work_mode.strip() or "未定义",
        required_skills=required,
        weights=normalized,
        summary=summary,
        interview_questions=interview_questions,
        engine=engine,
        saved=saved,
        created_at=datetime.utcnow().isoformat(),
    )


def save_enterprise_job_model(payload: EnterpriseJobModelSaveRequest) -> EnterpriseJobModelActionResponse:
    normalized = _normalize_weights(payload.weights)
    required = [item.strip() for item in payload.required_skills if item.strip()] or list(normalized.keys())[:3]
    interview_questions = [item.strip() for item in payload.interview_questions if item.strip()][:5]
    summary = payload.summary.strip() or "已保存岗位模型。"
    model_id = f"job_model_{uuid.uuid4().hex[:12]}"
    saved = _save_job_model(
        model_id=model_id,
        job_name=payload.job_name.strip() or "未命名岗位",
        department=payload.department.strip() or "未分配部门",
        level=payload.level.strip() or "未定义",
        work_mode=payload.work_mode.strip() or "未定义",
        required_skills=required,
        weights=normalized,
        summary=summary,
        interview_questions=interview_questions,
        engine="manual",
    )
    return EnterpriseJobModelActionResponse(
        model_id=model_id,
        job_name=payload.job_name.strip() or "未命名岗位",
        department=payload.department.strip() or "未分配部门",
        level=payload.level.strip() or "未定义",
        work_mode=payload.work_mode.strip() or "未定义",
        required_skills=required,
        weights=normalized,
        summary=summary,
        interview_questions=interview_questions,
        engine="manual",
        saved=saved,
        created_at=datetime.utcnow().isoformat(),
    )


def get_enterprise_recruitment() -> EnterpriseRecruitmentResponse:
    snapshot = _enterprise_snapshot()
    if snapshot:
        pass_count = snapshot["passed_latest"]
        interview_count = max(snapshot["interviewing_count"], int(pass_count * 0.4))
        review_count = max(0, int(interview_count * 0.65))
        offer_count = max(snapshot["offer_count"], int(review_count * 0.35))

        weakest = [row[0] for row in snapshot["weakest_three"] if row and row[0]]
        while len(weakest) < 3:
            weakest.append(f"关键能力{len(weakest) + 1}")

        return EnterpriseRecruitmentResponse(
            flow=[
                RecruitmentFlowItem(stage="TAI 初筛", count=pass_count, owner="HRBP", sla="T+1"),
                RecruitmentFlowItem(stage="面试安排", count=interview_count, owner="Recruiting Ops", sla="T+2"),
                RecruitmentFlowItem(stage="评估回流", count=review_count, owner="Interviewer", sla="T+1"),
                RecruitmentFlowItem(stage="Offer 复盘", count=offer_count, owner="Hiring Manager", sla="T+3"),
            ],
            templates=[
                InterviewTemplateItem(stage="一面", ability=weakest[0], question=f"请分享一个体现{weakest[0]}的真实项目场景。"),
                InterviewTemplateItem(stage="二面", ability=weakest[1], question=f"面对压力和变化时，你如何稳定输出并体现{weakest[1]}？"),
                InterviewTemplateItem(stage="终面", ability=weakest[2], question=f"请复盘一次失败案例，并说明你如何改进{weakest[2]}。"),
            ],
        )

    return EnterpriseRecruitmentResponse(
        flow=[],
        templates=[],
    )


def get_enterprise_analytics() -> EnterpriseAnalyticsResponse:
    snapshot = _enterprise_snapshot()
    if snapshot:
        type_counts = {str(row[0]): int(row[1]) for row in snapshot["simulation_types"]}
        job_count = type_counts.get("job", 0)
        growth_count = type_counts.get("growth", 0)
        other_count = max(0, sum(type_counts.values()) - job_count - growth_count)

        channel_rows = [
            AnalyticsChannelItem(channel="岗位模拟渠道", conversion=job_count, quality="高" if job_count >= growth_count else "中", schools="重点院校混合", note="来自 job simulation"),
            AnalyticsChannelItem(channel="成长训练渠道", conversion=growth_count, quality="中", schools="综合院校混合", note="来自 growth simulation"),
            AnalyticsChannelItem(channel="其他训练渠道", conversion=other_count, quality="中", schools="多源混合", note="来自其他 simulation type"),
        ]

        conninfo = get_psycopg_conninfo()
        heat_rows: list[AnalyticsSchoolHeatItem] = []
        if conninfo:
            try:
                with psycopg.connect(conninfo) as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            SELECT student_id, AVG(overall_score) AS avg_score
                            FROM app_simulation_sessions
                            GROUP BY student_id
                            """
                        )
                        rows = cur.fetchall()

                grouped: dict[str, list[float]] = {}
                for student_id, avg_score in rows:
                    bucket = _school_bucket(str(student_id))
                    grouped.setdefault(bucket, []).append(float(avg_score))

                weakest = [row[0] for row in snapshot["weakest_three"] if row and row[0]]
                for idx, (school, scores) in enumerate(sorted(grouped.items(), key=lambda x: len(x[1]), reverse=True)[:3]):
                    avg_fit = sum(scores) / len(scores) if scores else 0
                    heat_rows.append(
                        AnalyticsSchoolHeatItem(
                            school=school,
                            applicants=len(scores),
                            fit=str(int(round(avg_fit))),
                            gap=(weakest[idx] if idx < len(weakest) else "综合能力"),
                        )
                    )
            except Exception:  # noqa: BLE001
                heat_rows = []

        if not heat_rows:
            heat_rows = [
                AnalyticsSchoolHeatItem(school="华东理工大学", applicants=0, fit="0", gap="业务理解"),
                AnalyticsSchoolHeatItem(school="岭南财经大学", applicants=0, fit="0", gap="数据表达"),
                AnalyticsSchoolHeatItem(school="北方信息学院", applicants=0, fit="0", gap="跨团队协作"),
            ]

        gap_trend = {
            row[0]: int(round(float(row[1])))
            for row in snapshot["low_abilities"]
            if row and row[0]
        }
        if not gap_trend:
            gap_trend = {"业务理解": 70, "数据表达": 68, "跨团队协作": 66}

        return EnterpriseAnalyticsResponse(
            channel_rows=channel_rows,
            heat_rows=heat_rows,
            gap_trend=gap_trend,
        )

    return EnterpriseAnalyticsResponse(
        channel_rows=[],
        heat_rows=[],
        gap_trend={},
    )


def filter_enterprise_analytics(payload: EnterpriseAnalyticsFilterRequest) -> EnterpriseAnalyticsResponse:
    data = get_enterprise_analytics()
    school_key = payload.school.strip().lower()
    ability_key = payload.ability_gap.strip().lower()
    job_key = payload.job_family.strip().lower()

    heat_rows = data.heat_rows
    if school_key:
        heat_rows = [row for row in heat_rows if school_key in row.school.lower()]

    gap_trend = data.gap_trend
    if ability_key:
        gap_trend = {k: v for k, v in gap_trend.items() if ability_key in k.lower()}

    channel_rows = data.channel_rows
    if job_key:
        channel_rows = [row for row in channel_rows if job_key in row.channel.lower() or job_key in row.note.lower()]

    return EnterpriseAnalyticsResponse(
        channel_rows=channel_rows,
        heat_rows=heat_rows,
        gap_trend=gap_trend,
    )


def save_recruitment_feedback(payload: EnterpriseRecruitmentFeedbackRequest) -> EnterpriseRecruitmentFeedbackResponse:
    feedback_id = f"fb_{uuid.uuid4().hex[:12]}"
    conninfo = get_psycopg_conninfo()
    saved = False

    if conninfo:
        try:
            with psycopg.connect(conninfo) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS app_enterprise_recruitment_feedback (
                            feedback_id TEXT PRIMARY KEY,
                            candidate_id TEXT NOT NULL,
                            job_id TEXT NOT NULL,
                            business_score DOUBLE PRECISION NOT NULL,
                            communication_score DOUBLE PRECISION NOT NULL,
                            problem_solving_score DOUBLE PRECISION NOT NULL,
                            conclusion TEXT NOT NULL,
                            draft BOOLEAN NOT NULL,
                            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                        )
                        """
                    )
                    cur.execute(
                        """
                        INSERT INTO app_enterprise_recruitment_feedback (
                            feedback_id, candidate_id, job_id, business_score, communication_score, problem_solving_score, conclusion, draft
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            feedback_id,
                            payload.candidate_id,
                            payload.job_id,
                            float(payload.business_score),
                            float(payload.communication_score),
                            float(payload.problem_solving_score),
                            payload.conclusion,
                            payload.draft,
                        ),
                    )
                conn.commit()
            saved = True
        except Exception:  # noqa: BLE001
            saved = False

    return EnterpriseRecruitmentFeedbackResponse(
        feedback_id=feedback_id,
        saved=saved,
        draft=payload.draft,
        created_at=datetime.utcnow().isoformat(),
    )


def get_enterprise_partnerships() -> EnterprisePartnershipsResponse:
    snapshot = _enterprise_snapshot()
    if snapshot and snapshot["top_companies"]:
        schools: list[PartnershipSchoolItem] = []
        for idx, row in enumerate(snapshot["top_companies"]):
            company = str(row[0])
            active = int(row[1] or 0)
            avg_fit = float(row[2] or 0)
            schools.append(
                PartnershipSchoolItem(
                    school=_school_bucket(f"{company}-{idx}"),
                    active=active,
                    fit=f"{int(round(avg_fit))}%",
                    contact=company,
                    score=("A" if avg_fit >= 80 else ("B+" if avg_fit >= 72 else "B")),
                )
            )

        today = datetime.utcnow()
        activities = [
            PartnershipActivityItem(date=(today + timedelta(days=2)).strftime("%m-%d"), item="联合岗位说明会", owner="Campus Hiring", status="待执行"),
            PartnershipActivityItem(date=(today + timedelta(days=5)).strftime("%m-%d"), item="简历联合工作坊", owner="Recruiting Ops", status="已确认"),
            PartnershipActivityItem(date=(today + timedelta(days=8)).strftime("%m-%d"), item="导师双选沟通", owner="Business Interviewer", status="筹备中"),
        ]
        return EnterprisePartnershipsResponse(schools=schools[:3], activities=activities)

    return EnterprisePartnershipsResponse(
        schools=[],
        activities=[],
    )


def query_enterprise_partnerships(payload: EnterprisePartnershipQueryRequest) -> EnterprisePartnershipsResponse:
    data = get_enterprise_partnerships()
    query = payload.query.strip().lower()
    if not query:
        return data

    schools = [
        row
        for row in data.schools
        if query in row.school.lower() or query in row.contact.lower() or query in row.fit.lower()
    ]
    activities = [
        row
        for row in data.activities
        if query in row.item.lower() or query in row.owner.lower() or query in row.status.lower()
    ]
    return EnterprisePartnershipsResponse(schools=schools, activities=activities)


def get_enterprise_settings() -> EnterpriseSettingsResponse:
    conninfo = get_psycopg_conninfo()
    if conninfo:
        try:
            with psycopg.connect(conninfo) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS app_enterprise_settings_configs (
                            id BIGSERIAL PRIMARY KEY,
                            role_rows_json TEXT NOT NULL,
                            governance_rows_json TEXT NOT NULL,
                            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                        )
                        """
                    )
                    cur.execute(
                        """
                        SELECT role_rows_json, governance_rows_json
                        FROM app_enterprise_settings_configs
                        ORDER BY created_at DESC
                        LIMIT 1
                        """
                    )
                    row = cur.fetchone()
            if row:
                role_rows_raw = json.loads(row[0]) if row[0] else []
                governance_rows_raw = json.loads(row[1]) if row[1] else []
                return EnterpriseSettingsResponse(
                    role_rows=[RolePermissionItem.model_validate(item) for item in role_rows_raw],
                    governance_rows=[GovernanceRuleItem.model_validate(item) for item in governance_rows_raw],
                )
        except Exception:  # noqa: BLE001
            pass

    return EnterpriseSettingsResponse(
        role_rows=[
            RolePermissionItem(role="超级管理员", perms="组织配置/模板管理/成员权限/数据导出", scope="全量"),
            RolePermissionItem(role="HR", perms="建岗/筛选/流程推进/人才库管理", scope="招聘域"),
            RolePermissionItem(role="业务面试官", perms="面试评价/能力打分/反馈补充", scope="面试域"),
            RolePermissionItem(role="校招负责人", perms="院校协同/活动排期/合作复盘", scope="校招域"),
        ],
        governance_rows=[
            GovernanceRuleItem(item="最小必要展示", rule="跨端查看默认脱敏，按角色放开字段"),
            GovernanceRuleItem(item="匿名聚合", rule="报告默认按群体输出，不展示个体隐私"),
            GovernanceRuleItem(item="导出审计", rule="所有导出记录责任人、时间与用途"),
            GovernanceRuleItem(item="回流留痕", rule="面试评分回流保留版本与变更记录"),
        ],
    )


def save_enterprise_settings(payload: EnterpriseSettingsUpdateRequest) -> EnterpriseSettingsUpdateResponse:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return EnterpriseSettingsUpdateResponse(saved=False, updated_at=datetime.utcnow().isoformat())

    try:
        with psycopg.connect(conninfo) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS app_enterprise_settings_configs (
                        id BIGSERIAL PRIMARY KEY,
                        role_rows_json TEXT NOT NULL,
                        governance_rows_json TEXT NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
                cur.execute(
                    """
                    INSERT INTO app_enterprise_settings_configs (role_rows_json, governance_rows_json)
                    VALUES (%s, %s)
                    """,
                    (
                        json.dumps([item.model_dump() for item in payload.role_rows], ensure_ascii=False),
                        json.dumps([item.model_dump() for item in payload.governance_rows], ensure_ascii=False),
                    ),
                )
            conn.commit()
        return EnterpriseSettingsUpdateResponse(saved=True, updated_at=datetime.utcnow().isoformat())
    except Exception:  # noqa: BLE001
        return EnterpriseSettingsUpdateResponse(saved=False, updated_at=datetime.utcnow().isoformat())
