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
        name="",
        major="",
        grade="",
        overall_score=0.0,
        focus_areas=[],
    )


def _empty_dashboard(student_id: str) -> StudentDashboardResponse:
    return StudentDashboardResponse(
        student_id=student_id,
        metrics=[
            StudentDashboardMetric(title="综合能力得分", value="—", delta="—", hint="完成模拟后生成"),
            StudentDashboardMetric(title="模拟训练次数", value="0", delta="0", hint="尚未开始训练"),
            StudentDashboardMetric(title="岗位匹配中位分", value="—", delta="—", hint="完成求职模拟后更新"),
            StudentDashboardMetric(title="本周行动项", value="0", delta="0", hint="从模拟建议自动生成"),
        ],
        today_suggestions=[
            "开始一次成长模拟，建立能力基线",
            "在求职模拟中完成一轮高压追问训练",
            "上传简历并生成首份匹配分析",
        ],
        risk_summary="暂无模拟数据。完成成长或求职模拟后，系统将生成个性化诊断与行动建议。",
        resume_snapshot=get_latest_resume_snapshot(student_id),
    )


def _fallback_dashboard(student_id: str) -> StudentDashboardResponse:
    return _empty_dashboard(student_id)


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
            return _empty_dashboard(student_id)

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


def _empty_applications(student_id: str) -> StudentApplicationsResponse:
    return StudentApplicationsResponse(student_id=student_id, items=[])


def _fallback_applications(student_id: str) -> StudentApplicationsResponse:
    return _empty_applications(student_id)


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
            package_items = get_student_application_items(student_id)
            return StudentApplicationsResponse(student_id=student_id, items=package_items)

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
