from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta

import psycopg

from app.core.db import get_psycopg_conninfo
from app.schemas.school import (
    EmploymentMajorItem,
    GovernanceRuleItem,
    InterventionStrategyItem,
    MajorGapItem,
    ReportTemplateItem,
    RolePermissionItem,
    SchoolAnalyticsResponse,
    SchoolAnalyticsExportRequest,
    SchoolAnalyticsExportResponse,
    SchoolCurriculumOptimizeRequest,
    SchoolCurriculumOptimizeResponse,
    SchoolCurriculumResponse,
    SchoolDashboardResponse,
    SchoolEmploymentResponse,
    SchoolFeedbackItem,
    SchoolInterventionsResponse,
    SchoolMetricItem,
    SchoolPartnerItem,
    SchoolPartnershipsResponse,
    SchoolProjectItem,
    SchoolProjectPublishRequest,
    SchoolProjectPublishResponse,
    SchoolProjectQuestionGenerateRequest,
    SchoolProjectQuestionGenerateResponse,
    SchoolProjectsResponse,
    SchoolSettingsResponse,
    SchoolSettingsUpdateRequest,
    SchoolSettingsUpdateResponse,
    SchoolInterventionItem,
    SchoolStudentAbilitySnapshot,
    SchoolStudentDetailResponse,
    SchoolStudentSimulation,
    StudentSummary,
)
from app.services.agent_llm_service import llm_generate_json, should_try_real_llm


def _risk_level(score: float) -> str:
    if score >= 80:
        return "low"
    if score >= 65:
        return "medium"
    return "high"


def _fallback_students() -> list[StudentSummary]:
    return []


def _filter_students(items: list[StudentSummary], risk_level: str | None, min_score: float | None) -> list[StudentSummary]:
    filtered = items
    if risk_level:
        filtered = [item for item in filtered if item.risk_level == risk_level]
    if min_score is not None:
        filtered = [item for item in filtered if item.overall_score >= min_score]
    return filtered


def list_school_students(risk_level: str | None, min_score: float | None) -> list[StudentSummary]:
    conninfo = get_psycopg_conninfo()

    if not conninfo:
        return _filter_students(_fallback_students(), risk_level, min_score)

    try:
        with psycopg.connect(conninfo) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT s.student_id, s.simulation_type, s.overall_score
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
                rows = cur.fetchall()

        if not rows:
            return _filter_students(_fallback_students(), risk_level, min_score)

        items = [
            StudentSummary(
                user_id=row[0],
                name=f"学生 {row[0]}",
                major="信息管理与信息系统",
                risk_level=_risk_level(float(row[2])),
                overall_score=float(row[2]),
                latest_simulation_type=row[1],
            )
            for row in rows
        ]

        return _filter_students(items, risk_level, min_score)
    except Exception:  # noqa: BLE001
        return _filter_students(_fallback_students(), risk_level, min_score)


def _fallback_student_detail(student_id: str) -> SchoolStudentDetailResponse:
    return SchoolStudentDetailResponse(
        student_id=student_id,
        name=f"学生 {student_id}",
        major="",
        grade="",
        risk_level="unknown",
        overall_score=0,
        focus_areas=[],
        latest_simulations=[],
        ability_snapshot=[],
        interventions=[],
    )


def get_school_student_detail(student_id: str) -> SchoolStudentDetailResponse:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return _fallback_student_detail(student_id)

    try:
        with psycopg.connect(conninfo) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT session_id, simulation_type, overall_score, summary, created_at
                    FROM app_simulation_sessions
                    WHERE student_id = %s
                    ORDER BY created_at DESC
                    LIMIT 6
                    """,
                    (student_id,),
                )
                simulation_rows = cur.fetchall()

                if not simulation_rows:
                    return _fallback_student_detail(student_id)

                latest_session_id = simulation_rows[0][0]
                overall_score = float(simulation_rows[0][2])

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

        latest_simulations = [
            SchoolStudentSimulation(
                session_id=row[0],
                simulation_type=row[1],
                overall_score=float(row[2]),
                summary=row[3],
                created_at=(row[4].isoformat() if isinstance(row[4], datetime) else str(row[4])),
            )
            for row in simulation_rows
        ]

        ability_snapshot = [
            SchoolStudentAbilitySnapshot(ability_key=row[0], ability_label=row[1], score=float(row[2]), trend=row[3])
            for row in ability_rows
        ]

        focus_areas = [item.ability_label for item in sorted(ability_snapshot, key=lambda x: x.score)[:3]]

        interventions = [
            SchoolInterventionItem(title="每周一次压力问答训练", priority="P1", owner="就业指导老师", due_date="2026-04-10"),
            SchoolInterventionItem(title="补充2个岗位业务分析案例", priority="P1", owner="学院导师", due_date="2026-04-15"),
            SchoolInterventionItem(title="结构化表达复盘打卡", priority="P2", owner="辅导员", due_date="2026-04-20"),
        ]

        return SchoolStudentDetailResponse(
            student_id=student_id,
            name=f"学生 {student_id}",
            major="信息管理与信息系统",
            grade="2023级",
            risk_level=_risk_level(overall_score),
            overall_score=overall_score,
            focus_areas=focus_areas,
            latest_simulations=latest_simulations,
            ability_snapshot=ability_snapshot,
            interventions=interventions,
        )
    except Exception:  # noqa: BLE001
        return _fallback_student_detail(student_id)


def _school_snapshot() -> dict | None:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return None

    try:
        with psycopg.connect(conninfo) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(DISTINCT student_id) FROM app_simulation_sessions")
                student_count = int(cur.fetchone()[0] or 0)

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
                    WHERE s.overall_score < 65
                    """
                )
                high_risk = int(cur.fetchone()[0] or 0)

                cur.execute(
                    """
                    SELECT ability_label, AVG(score) AS avg_score
                    FROM app_ability_snapshots
                    GROUP BY ability_label
                    ORDER BY avg_score ASC
                    """
                )
                ability_rows = cur.fetchall()

                cur.execute(
                    """
                    SELECT company, COUNT(*) AS cnt, AVG(match_score) AS avg_fit
                    FROM app_job_recommendations
                    GROUP BY company
                    ORDER BY cnt DESC
                    LIMIT 4
                    """
                )
                companies = cur.fetchall()

                cur.execute(
                    """
                    SELECT target_job, COUNT(*) AS cnt
                    FROM app_simulation_sessions
                    WHERE target_job IS NOT NULL AND target_job <> ''
                    GROUP BY target_job
                    ORDER BY cnt DESC
                    LIMIT 4
                    """
                )
                target_jobs = cur.fetchall()

                cur.execute("SELECT COALESCE(AVG(match_score), 0) FROM app_job_recommendations")
                avg_match = float(cur.fetchone()[0] or 0)

        return {
            "student_count": student_count,
            "monthly_sessions": monthly_sessions,
            "high_risk": high_risk,
            "ability_rows": ability_rows,
            "companies": companies,
            "target_jobs": target_jobs,
            "avg_match": avg_match,
        }
    except Exception:  # noqa: BLE001
        return None


def get_school_dashboard() -> SchoolDashboardResponse:
    snapshot = _school_snapshot()
    if snapshot:
        student_count = snapshot["student_count"]
        high_risk = snapshot["high_risk"]
        readiness_rate = int(round(((student_count - high_risk) / student_count) * 100)) if student_count else 0
        major_gaps = []
        for idx, row in enumerate(snapshot["ability_rows"][:3]):
            label = str(row[0])
            avg_score = float(row[1] or 0)
            level = "高" if avg_score < 65 else ("中" if avg_score < 75 else "低")
            major_gaps.append(MajorGapItem(major=f"重点专业群 {idx + 1}", gap=label, level=level))

        if not major_gaps:
            major_gaps = [
                MajorGapItem(major="重点专业群 1", gap="业务理解", level="高"),
                MajorGapItem(major="重点专业群 2", gap="数据表达", level="中"),
                MajorGapItem(major="重点专业群 3", gap="跨团队协作", level="中"),
            ]

        return SchoolDashboardResponse(
            metrics=[
                SchoolMetricItem(title="学生覆盖人数", value=str(student_count), delta=f"+{snapshot['monthly_sessions']}", hint="来自近30天模拟活跃"),
                SchoolMetricItem(title="就业准备达标率", value=f"{readiness_rate}%", delta=f"{int(round(snapshot['avg_match']))} fit", hint="由最新风险层级与匹配度计算"),
                SchoolMetricItem(title="校企合作企业", value=str(len(snapshot["companies"])), delta="+0", hint="来自推荐记录中的企业去重"),
                SchoolMetricItem(title="高风险待干预", value=str(high_risk), delta="0", hint="最新成绩低于 65 的学生"),
            ],
            major_gaps=major_gaps,
        )

    return SchoolDashboardResponse(
        metrics=[
            SchoolMetricItem(title="学生覆盖人数", value="0", delta="+0", hint="等待真实数据"),
            SchoolMetricItem(title="就业准备达标率", value="0%", delta="+0", hint="等待真实数据"),
            SchoolMetricItem(title="校企合作企业", value="0", delta="+0", hint="等待真实数据"),
            SchoolMetricItem(title="高风险待干预", value="0", delta="+0", hint="等待真实数据"),
        ],
        major_gaps=[],
    )


def get_school_curriculum() -> SchoolCurriculumResponse:
    snapshot = _school_snapshot()
    if snapshot and snapshot["ability_rows"]:
        rows = []
        for idx, ability in enumerate(snapshot["ability_rows"][:4]):
            ability_label = str(ability[0])
            avg_score = float(ability[1] or 0)
            contribution = "高" if avg_score >= 75 else ("中" if avg_score >= 65 else "低")
            market = "匹配" if avg_score >= 72 else "需增强"
            rows.append(
                {
                    "course": f"课程模块 {idx + 1}",
                    "ability": ability_label,
                    "contribution": contribution,
                    "market": market,
                }
            )

        suggestions = [
            f"针对 {str(snapshot['ability_rows'][0][0])} 增加项目化训练并绑定过程评价。",
            "将课程考核拆分为知识掌握与岗位情境表达双维度。",
            "每月同步企业反馈，更新课程-能力映射权重。",
            "保留近两学期版本对比，量化改造前后效果。",
        ]
        return SchoolCurriculumResponse(map_rows=rows, optimize_suggestions=suggestions)

    return SchoolCurriculumResponse(
        map_rows=[],
        optimize_suggestions=[],
    )


def _fallback_curriculum_optimize(payload: SchoolCurriculumOptimizeRequest) -> tuple[list[dict], list[str], str]:
    rows = []
    for index, item in enumerate(payload.current_rows[:6]):
        contribution = item.contribution if item.contribution else ("高" if index < 2 else "中")
        market = item.market if item.market else ("匹配" if index < 2 else "需增强")
        rows.append(
            {
                "course": item.course,
                "ability": item.ability,
                "contribution": contribution,
                "market": market,
            }
        )

    if not rows:
        rows = [
            {"course": "课程模块A", "ability": "业务理解 / 情境分析", "contribution": "高", "market": "匹配"},
            {"course": "课程模块B", "ability": "数据表达 / 复盘汇报", "contribution": "中", "market": "需增强"},
            {"course": "课程模块C", "ability": "协作沟通 / 项目推进", "contribution": "中", "market": "需增强"},
        ]

    suggestions = [
        f"围绕 {rows[0]['ability']} 增加项目型考核，并纳入过程评分。",
        "建立课程-能力-就业去向联动看板，按月校准映射权重。",
        "将企业反馈转化为课堂案例库，提升岗位场景贴合度。",
        "每学期保留版本快照，支持教学方案前后对比。",
    ]
    return rows, suggestions, "mock"


def _optimize_curriculum(payload: SchoolCurriculumOptimizeRequest) -> tuple[list[dict], list[str], str]:
    if should_try_real_llm():
        system_prompt = (
            "你是高校课程改革顾问。请返回严格 JSON，不要输出 Markdown。"
            "map_rows 每项包含 course/ability/contribution/market。"
        )
        current_rows = [
            {
                "course": item.course,
                "ability": item.ability,
                "contribution": item.contribution,
                "market": item.market,
            }
            for item in payload.current_rows
        ]
        user_prompt = (
            f"专业: {payload.major}\n"
            f"培养目标: {payload.objective}\n"
            f"补充说明: {payload.context_note}\n"
            f"现有映射: {json.dumps(current_rows, ensure_ascii=False)}\n\n"
            "返回 JSON:\n"
            "{\n"
            '  "map_rows": [{"course":"", "ability":"", "contribution":"高|中|低", "market":"匹配|需增强"}],\n'
            '  "optimize_suggestions": ["建议1", "建议2", "建议3"]\n'
            "}"
        )
        llm_json, llm_error = llm_generate_json(system_prompt=system_prompt, user_prompt=user_prompt, temperature=0.2)
        if isinstance(llm_json, dict):
            raw_rows = llm_json.get("map_rows", [])
            raw_suggestions = llm_json.get("optimize_suggestions", [])
            rows: list[dict] = []
            for item in raw_rows if isinstance(raw_rows, list) else []:
                if not isinstance(item, dict):
                    continue
                rows.append(
                    {
                        "course": str(item.get("course", "")).strip() or "课程模块",
                        "ability": str(item.get("ability", "")).strip() or "综合能力",
                        "contribution": str(item.get("contribution", "")).strip() or "中",
                        "market": str(item.get("market", "")).strip() or "需增强",
                    }
                )
            suggestions = [str(item).strip() for item in raw_suggestions if str(item).strip()]
            if rows and suggestions:
                return rows[:8], suggestions[:6], "openai"
        if llm_error:
            pass

    return _fallback_curriculum_optimize(payload)


def _save_curriculum_plan(
    plan_id: str,
    major: str,
    objective: str,
    map_rows: list[dict],
    optimize_suggestions: list[str],
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
                    CREATE TABLE IF NOT EXISTS app_school_curriculum_plans (
                        plan_id TEXT PRIMARY KEY,
                        major TEXT NOT NULL,
                        objective TEXT NOT NULL,
                        map_rows_json TEXT NOT NULL,
                        optimize_suggestions_json TEXT NOT NULL,
                        engine TEXT NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
                cur.execute(
                    """
                    INSERT INTO app_school_curriculum_plans (
                        plan_id, major, objective, map_rows_json, optimize_suggestions_json, engine
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        plan_id,
                        major,
                        objective,
                        json.dumps(map_rows, ensure_ascii=False),
                        json.dumps(optimize_suggestions, ensure_ascii=False),
                        engine,
                    ),
                )
            conn.commit()
        return True
    except Exception:  # noqa: BLE001
        return False


def optimize_school_curriculum(payload: SchoolCurriculumOptimizeRequest) -> SchoolCurriculumOptimizeResponse:
    map_rows, optimize_suggestions, engine = _optimize_curriculum(payload)
    plan_id = f"curr_plan_{uuid.uuid4().hex[:12]}"
    saved = _save_curriculum_plan(
        plan_id=plan_id,
        major=payload.major.strip() or "未命名专业",
        objective=payload.objective.strip() or "未设置目标",
        map_rows=map_rows,
        optimize_suggestions=optimize_suggestions,
        engine=engine,
    )
    return SchoolCurriculumOptimizeResponse(
        plan_id=plan_id,
        major=payload.major.strip() or "未命名专业",
        objective=payload.objective.strip() or "未设置目标",
        map_rows=map_rows,
        optimize_suggestions=optimize_suggestions,
        engine=engine,
        saved=saved,
        created_at=datetime.utcnow().isoformat(),
    )


def get_school_projects() -> SchoolProjectsResponse:
    snapshot = _school_snapshot()
    if snapshot and snapshot["target_jobs"]:
        projects: list[SchoolProjectItem] = []
        statuses = ["招募中", "面试中", "进行中", "已满额"]
        for idx, row in enumerate(snapshot["target_jobs"][:3]):
            target_job = str(row[0])
            demand = int(row[1] or 0)
            projects.append(
                SchoolProjectItem(
                    name=f"{target_job} 实践课题",
                    need="业务理解 / 数据表达 / 协作复盘",
                    slots=max(3, min(12, demand)),
                    status=statuses[idx % len(statuses)],
                )
            )
        return SchoolProjectsResponse(projects=projects)

    return SchoolProjectsResponse(
        projects=[]
    )


def publish_school_project(payload: SchoolProjectPublishRequest) -> SchoolProjectPublishResponse:
    project_id = f"proj_{uuid.uuid4().hex[:12]}"
    conninfo = get_psycopg_conninfo()
    saved = False
    if conninfo:
        try:
            with psycopg.connect(conninfo) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS app_school_projects (
                            project_id TEXT PRIMARY KEY,
                            name TEXT NOT NULL,
                            need TEXT NOT NULL,
                            slots INTEGER NOT NULL,
                            status TEXT NOT NULL,
                            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                        )
                        """
                    )
                    cur.execute(
                        """
                        INSERT INTO app_school_projects (project_id, name, need, slots, status)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (project_id, payload.name, payload.need, int(payload.slots), payload.status),
                    )
                conn.commit()
            saved = True
        except Exception:  # noqa: BLE001
            saved = False

    return SchoolProjectPublishResponse(
        project_id=project_id,
        name=payload.name,
        need=payload.need,
        slots=int(payload.slots),
        status=payload.status,
        saved=saved,
        created_at=datetime.utcnow().isoformat(),
    )


def generate_school_project_questions(payload: SchoolProjectQuestionGenerateRequest) -> SchoolProjectQuestionGenerateResponse:
    if should_try_real_llm():
        system_prompt = "你是高校项目导师，请输出严格 JSON，不要 Markdown。"
        user_prompt = (
            f"项目名称: {payload.name}\n"
            f"能力要求: {payload.need}\n"
            "请生成 5 条结构化面试问题。输出 JSON: {\"questions\": [\"...\"]}"
        )
        llm_json, _ = llm_generate_json(system_prompt=system_prompt, user_prompt=user_prompt, temperature=0.2)
        if isinstance(llm_json, dict):
            questions = [str(item).strip() for item in llm_json.get("questions", []) if str(item).strip()]
            if questions:
                return SchoolProjectQuestionGenerateResponse(questions=questions[:5], engine="openai")

    questions = [
        f"你如何在项目中体现 {payload.need.split('/')[0].strip()}？",
        "请描述你处理复杂任务优先级冲突的一次经历。",
        "在团队协作中遇到意见不一致时你如何推进？",
        "你会如何验证该项目阶段性目标是否达成？",
        "请给出一个可量化的项目复盘指标方案。",
    ]
    return SchoolProjectQuestionGenerateResponse(questions=questions, engine="mock")


def get_school_employment() -> SchoolEmploymentResponse:
    snapshot = _school_snapshot()
    if snapshot and snapshot["target_jobs"]:
        rows: list[EmploymentMajorItem] = []
        for idx, row in enumerate(snapshot["target_jobs"][:3]):
            target = str(row[0])
            demand = int(row[1] or 0)
            match = min(95, max(55, int(round(snapshot["avg_match"])) + idx * 2))
            quality = "表现良好" if match >= 80 else ("稳步提升" if match >= 70 else "需加强软技能")
            rows.append(
                EmploymentMajorItem(
                    major=f"专业群 {idx + 1}",
                    target=target,
                    match=f"{match}%",
                    quality=quality,
                )
            )
        return SchoolEmploymentResponse(major_rows=rows)

    return SchoolEmploymentResponse(
        major_rows=[]
    )


def get_school_interventions() -> SchoolInterventionsResponse:
    snapshot = _school_snapshot()
    if snapshot and snapshot["ability_rows"]:
        weakest = [str(row[0]) for row in snapshot["ability_rows"][:3]]
        while len(weakest) < 3:
            weakest.append(f"关键能力{len(weakest) + 1}")
        return SchoolInterventionsResponse(
            strategies=[
                InterventionStrategyItem(level="高风险", strategy=f"围绕 {weakest[0]} 开展每周导师面谈 + 场景复盘", owner="就业中心"),
                InterventionStrategyItem(level="中风险", strategy=f"开展 {weakest[1]} 主题工作坊 + 岗位案例训练", owner="学院导师"),
                InterventionStrategyItem(level="低风险", strategy=f"通过项目实践强化 {weakest[2]} 并提升稳定性", owner="辅导员"),
            ],
            rules=[
                "干预任务逾期 3 天自动升级提醒。",
                "每轮干预结束自动生成效果摘要与下一步建议。",
                "同类风险学生可批量套用任务模板。",
                "干预结果同步更新到学生能力画像与就业准备度。",
            ],
        )

    return SchoolInterventionsResponse(
        strategies=[],
        rules=[],
    )


def get_school_partnerships() -> SchoolPartnershipsResponse:
    snapshot = _school_snapshot()
    if snapshot and snapshot["companies"]:
        partners = [
            SchoolPartnerItem(
                company=str(row[0]),
                focus=f"{str(row[0])} 联合培养课题",
                status=("进行中" if idx % 2 == 0 else "待续签"),
            )
            for idx, row in enumerate(snapshot["companies"][:3])
        ]

        weakest = [str(row[0]) for row in snapshot["ability_rows"][:3]]
        feedback = [
            SchoolFeedbackItem(
                company=str(row[0]),
                praise="执行稳定",
                gap=(weakest[idx] if idx < len(weakest) else "综合表达"),
                priority=("高" if idx == 0 else "中"),
            )
            for idx, row in enumerate(snapshot["companies"][:3])
        ]
        return SchoolPartnershipsResponse(partners=partners, feedback_rows=feedback)

    return SchoolPartnershipsResponse(
        partners=[],
        feedback_rows=[],
    )


def get_school_analytics() -> SchoolAnalyticsResponse:
    snapshot = _school_snapshot()
    if snapshot:
        weakest = [str(row[0]) for row in snapshot["ability_rows"][:2]]
        top_job = str(snapshot["target_jobs"][0][0]) if snapshot["target_jobs"] else "重点岗位群"
        return SchoolAnalyticsResponse(
            report_rows=[
                ReportTemplateItem(type="校级决策版", focus=f"覆盖规模 {snapshot['student_count']} + 高风险 {snapshot['high_risk']}", output="校务会议汇报包"),
                ReportTemplateItem(type="学院改革版", focus=f"课程能力缺口: {weakest[0] if weakest else '综合能力'}", output="学院教学改革材料"),
                ReportTemplateItem(type="专业优化版", focus=f"岗位适配焦点: {top_job}", output="专业培养方案修订"),
                ReportTemplateItem(type="教师改进版", focus=f"课堂能力达成: {weakest[1] if len(weakest) > 1 else '项目表达'}", output="课程迭代清单"),
            ]
        )

    return SchoolAnalyticsResponse(
        report_rows=[]
    )


def export_school_analytics(payload: SchoolAnalyticsExportRequest) -> SchoolAnalyticsExportResponse:
    export_id = f"exp_{uuid.uuid4().hex[:12]}"
    conninfo = get_psycopg_conninfo()
    saved = False
    if conninfo:
        try:
            with psycopg.connect(conninfo) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS app_school_analytics_exports (
                            export_id TEXT PRIMARY KEY,
                            export_type TEXT NOT NULL,
                            time_range TEXT NOT NULL,
                            school TEXT NOT NULL,
                            major TEXT NOT NULL,
                            version TEXT NOT NULL,
                            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                        )
                        """
                    )
                    cur.execute(
                        """
                        INSERT INTO app_school_analytics_exports (
                            export_id, export_type, time_range, school, major, version
                        ) VALUES (%s, %s, %s, %s, %s, %s)
                        """,
                        (
                            export_id,
                            payload.export_type,
                            payload.time_range,
                            payload.school,
                            payload.major,
                            payload.version,
                        ),
                    )
                conn.commit()
            saved = True
        except Exception:  # noqa: BLE001
            saved = False

    return SchoolAnalyticsExportResponse(
        export_id=export_id,
        export_type=payload.export_type,
        saved=saved,
        created_at=datetime.utcnow().isoformat(),
    )


def get_school_settings() -> SchoolSettingsResponse:
    conninfo = get_psycopg_conninfo()
    if conninfo:
        try:
            with psycopg.connect(conninfo) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS app_school_settings_configs (
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
                        FROM app_school_settings_configs
                        ORDER BY created_at DESC
                        LIMIT 1
                        """
                    )
                    row = cur.fetchone()
            if row:
                role_rows_raw = json.loads(row[0]) if row[0] else []
                governance_rows_raw = json.loads(row[1]) if row[1] else []
                return SchoolSettingsResponse(
                    role_rows=[RolePermissionItem.model_validate(item) for item in role_rows_raw],
                    governance_rows=[GovernanceRuleItem.model_validate(item) for item in governance_rows_raw],
                )
        except Exception:  # noqa: BLE001
            pass

    return SchoolSettingsResponse(
        role_rows=[
            RolePermissionItem(role="校级管理员", perms="全校数据/专业比较/校企全局配置", scope="校级"),
            RolePermissionItem(role="学院管理员", perms="学院学生/课程/报告管理", scope="院级"),
            RolePermissionItem(role="教师/导师", perms="课程映射/项目发布/授权查看", scope="课程与项目"),
            RolePermissionItem(role="就业老师", perms="岗位适配/去向分析/企业协同", scope="就业域"),
        ],
        governance_rows=[
            GovernanceRuleItem(item="学生隐私保护", rule="跨组织查看默认匿名，不显示敏感身份字段"),
            GovernanceRuleItem(item="报告口径统一", rule="校级/院级/专业级模板统一指标定义"),
            GovernanceRuleItem(item="反馈回流机制", rule="企业反馈入库后自动映射课程改进项"),
            GovernanceRuleItem(item="权限可追踪", rule="关键操作记录操作者与审批链"),
        ],
    )


def save_school_settings(payload: SchoolSettingsUpdateRequest) -> SchoolSettingsUpdateResponse:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return SchoolSettingsUpdateResponse(saved=False, updated_at=datetime.utcnow().isoformat())

    try:
        with psycopg.connect(conninfo) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS app_school_settings_configs (
                        id BIGSERIAL PRIMARY KEY,
                        role_rows_json TEXT NOT NULL,
                        governance_rows_json TEXT NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
                cur.execute(
                    """
                    INSERT INTO app_school_settings_configs (role_rows_json, governance_rows_json)
                    VALUES (%s, %s)
                    """,
                    (
                        json.dumps([item.model_dump() for item in payload.role_rows], ensure_ascii=False),
                        json.dumps([item.model_dump() for item in payload.governance_rows], ensure_ascii=False),
                    ),
                )
            conn.commit()
        return SchoolSettingsUpdateResponse(saved=True, updated_at=datetime.utcnow().isoformat())
    except Exception:  # noqa: BLE001
        return SchoolSettingsUpdateResponse(saved=False, updated_at=datetime.utcnow().isoformat())
