from __future__ import annotations

from datetime import datetime

import psycopg

from app.core.db import get_psycopg_conninfo
from app.schemas.students import (
    StudentApplicationItem,
    StudentApplicationsResponse,
    StudentAbilityTrendPoint,
    StudentAbilityTrendResponse,
    StudentAbilityTrendSeries,
    StudentDashboardMetric,
    StudentDashboardResponse,
    StudentOverviewResponse,
)
from app.services.application_service import get_latest_resume_snapshot, get_student_application_items


def get_student_overview(student_id: str) -> StudentOverviewResponse:
    return StudentOverviewResponse(
        user_id=student_id,
        name="张同学",
        major="信息管理与信息系统",
        grade="2023级",
        overall_score=84.6,
        focus_areas=["高压沟通", "结构化表达", "业务指标拆解"],
    )


def _fallback_dashboard(student_id: str) -> StudentDashboardResponse:
    return StudentDashboardResponse(
        student_id=student_id,
        metrics=[
            StudentDashboardMetric(title="综合能力得分", value="84.6", delta="+3.4", hint="最近2周提升明显"),
            StudentDashboardMetric(title="模拟训练次数", value="27", delta="+5", hint="成长模拟 14 / 求职模拟 13"),
            StudentDashboardMetric(title="岗位匹配中位分", value="78", delta="+6", hint="偏向产品运营岗"),
            StudentDashboardMetric(title="本周行动项", value="4", delta="-1", hint="建议完成 3 项必做训练"),
        ],
        today_suggestions=[
            "完成一次压力面试模拟",
            "更新项目经历 STAR 描述",
            "复盘最近一次团队协作事件",
        ],
        risk_summary="抗压能力与逻辑分析能力波动较大，建议在求职模拟器中开启高压追问场景训练。",
        resume_snapshot=get_latest_resume_snapshot(student_id),
    )


def _ensure_application_table(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS app_student_applications (
                id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                job_title TEXT NOT NULL,
                company TEXT NOT NULL,
                status TEXT NOT NULL,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
    conn.commit()


def get_student_dashboard(student_id: str) -> StudentDashboardResponse:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return _fallback_dashboard(student_id)

    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_application_table(conn)
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM app_simulation_sessions WHERE student_id = %s", (student_id,))
                simulation_count = int(cur.fetchone()[0])

                cur.execute("SELECT AVG(overall_score) FROM app_simulation_sessions WHERE student_id = %s", (student_id,))
                avg_score_row = cur.fetchone()[0]
                avg_score = float(avg_score_row) if avg_score_row is not None else 0.0

                cur.execute("SELECT AVG(match_score) FROM app_job_recommendations WHERE student_id = %s", (student_id,))
                avg_match_row = cur.fetchone()[0]
                avg_match = float(avg_match_row) if avg_match_row is not None else 0.0

                cur.execute("SELECT COUNT(*) FROM app_student_applications WHERE student_id = %s", (student_id,))
                application_count = int(cur.fetchone()[0])

        if simulation_count == 0:
            return _fallback_dashboard(student_id)

        return StudentDashboardResponse(
            student_id=student_id,
            metrics=[
                StudentDashboardMetric(title="综合能力得分", value=f"{avg_score:.1f}", delta="+0.0", hint="基于最近模拟均分"),
                StudentDashboardMetric(title="模拟训练次数", value=str(simulation_count), delta="+0", hint="来自数据库真实记录"),
                StudentDashboardMetric(title="岗位匹配中位分", value=f"{avg_match:.0f}", delta="+0", hint="根据推荐结果聚合"),
                StudentDashboardMetric(title="本周行动项", value=str(max(1, 4 - min(3, application_count))), delta="0", hint="由投递状态自动计算"),
            ],
            today_suggestions=[
                "完成一次成长场景复盘并记录关键行动",
                "针对目标岗位补齐一条量化项目案例",
                "本周至少进行一次高压追问训练",
            ],
            risk_summary=(
                "综合表现稳定，建议继续提升压力场景下的结构化表达。"
                if avg_score >= 75
                else "当前综合得分波动较大，建议优先完成抗压与沟通专项训练。"
            ),
            resume_snapshot=get_latest_resume_snapshot(student_id),
        )
    except Exception:  # noqa: BLE001
        return _fallback_dashboard(student_id)


def _fallback_applications(student_id: str) -> StudentApplicationsResponse:
    package_items = get_student_application_items(student_id)
    return StudentApplicationsResponse(
        student_id=student_id,
        items=package_items
        + [
            StudentApplicationItem(id="A-1001", job="产品运营专员", company="星澜科技", status="已投递", date="2026-03-12"),
            StudentApplicationItem(id="A-1002", job="校园市场培训生", company="映河教育", status="面试中", date="2026-03-16"),
            StudentApplicationItem(id="A-1003", job="数据运营助理", company="云策数据", status="待反馈", date="2026-03-18"),
        ],
    )


def get_student_applications(student_id: str) -> StudentApplicationsResponse:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return _fallback_applications(student_id)

    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_application_table(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, job_title, company, status, applied_at
                    FROM app_student_applications
                    WHERE student_id = %s
                    ORDER BY applied_at DESC
                    LIMIT 50
                    """,
                    (student_id,),
                )
                rows = cur.fetchall()

        if not rows:
            return _fallback_applications(student_id)

        items = [
            StudentApplicationItem(
                id=row[0],
                job=row[1],
                company=row[2],
                status=row[3],
                date=(row[4].strftime("%Y-%m-%d") if isinstance(row[4], datetime) else str(row[4])[:10]),
            )
            for row in rows
        ]
        package_items = get_student_application_items(student_id)
        if package_items:
            existing_ids = {item.id for item in items}
            items = package_items + [item for item in items if item.id not in existing_ids]
        return StudentApplicationsResponse(student_id=student_id, items=items)
    except Exception:  # noqa: BLE001
        return _fallback_applications(student_id)


def get_student_ability_trend(student_id: str) -> StudentAbilityTrendResponse:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return StudentAbilityTrendResponse(student_id=student_id, series=[])

    try:
        with psycopg.connect(conninfo) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT ability_key, ability_label, DATE(created_at) AS day, AVG(score) AS avg_score
                    FROM app_ability_snapshots
                    WHERE student_id = %s
                    GROUP BY ability_key, ability_label, DATE(created_at)
                    ORDER BY day ASC
                    """,
                    (student_id,),
                )
                rows = cur.fetchall()

        if not rows:
            return StudentAbilityTrendResponse(student_id=student_id, series=[])

        grouped: dict[tuple[str, str], list[StudentAbilityTrendPoint]] = {}
        for ability_key, ability_label, day, avg_score in rows:
            key = (ability_key, ability_label)
            grouped.setdefault(key, []).append(
                StudentAbilityTrendPoint(
                    date=(day.strftime("%Y-%m-%d") if hasattr(day, "strftime") else str(day)),
                    score=float(avg_score),
                )
            )

        series = [
            StudentAbilityTrendSeries(ability_key=k[0], ability_label=k[1], points=v)
            for k, v in grouped.items()
        ]
        return StudentAbilityTrendResponse(student_id=student_id, series=series)
    except Exception:  # noqa: BLE001
        return StudentAbilityTrendResponse(student_id=student_id, series=[])
