from __future__ import annotations

import json
from datetime import datetime, timezone
from io import BytesIO
from statistics import mean
from uuid import uuid4

import psycopg

from app.core.db import get_psycopg_conninfo
from app.schemas.students import (
    ApplicationPackage,
    ApplicationSubmitRequest,
    ApplicationSubmitResponse,
    AssessmentDimensionScore,
    AssessmentGenerateRequest,
    AssessmentGenerateResponse,
    AssessmentQuestion,
    AssessmentResult,
    AssessmentSubmitRequest,
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
    ResumeAnalysisResult,
    ResumeExtractResponse,
    ResumeExtractedInfo,
    ResumeSnapshot,
    SimulationDigestItem,
    StudentApplicationItem,
)
from app.services.agent_llm_service import llm_generate_json, should_try_real_llm
from app.services.simulation_service import get_simulation_history

RESUME_ANALYSIS_STORE: dict[str, list[ResumeAnalysisResponse]] = {}
ASSESSMENT_STORE: dict[str, AssessmentGenerateResponse] = {}
APPLICATION_PACKAGE_STORE: dict[str, list[ApplicationPackage]] = {}

try:
    from pypdf import PdfReader
except Exception:  # noqa: BLE001
    PdfReader = None

try:
    from docx import Document
except Exception:  # noqa: BLE001
    Document = None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _conninfo() -> str | None:
    return get_psycopg_conninfo()


def _ensure_tables(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS app_resume_analyses (
                analysis_id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                payload JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS app_assessment_results (
                assessment_id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                payload JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS app_application_packages (
                application_id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                payload JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        # Backward-compatible schema evolution
        cur.execute("ALTER TABLE app_application_packages ADD COLUMN IF NOT EXISTS job_id TEXT;")
        cur.execute("ALTER TABLE app_application_packages ADD COLUMN IF NOT EXISTS company_id TEXT;")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_app_packages_company ON app_application_packages(company_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_app_packages_job ON app_application_packages(job_id);")
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS app_student_applications (
                id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                job_title TEXT NOT NULL,
                company TEXT NOT NULL,
                status TEXT NOT NULL,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                resume_name TEXT,
                resume_fit_score DOUBLE PRECISION,
                assessment_score DOUBLE PRECISION,
                has_assessment BOOLEAN NOT NULL DEFAULT FALSE
            );
            """
        )
        cur.execute("ALTER TABLE app_student_applications ADD COLUMN IF NOT EXISTS job_id TEXT;")
        cur.execute("ALTER TABLE app_student_applications ADD COLUMN IF NOT EXISTS company_id TEXT;")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_student_apps_company ON app_student_applications(company_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_student_apps_job ON app_student_applications(job_id);")
    conn.commit()


def _pick_lines(text: str, limit: int = 5) -> list[str]:
    rows = [line.strip(" -\t") for line in text.splitlines() if line.strip()]
    return rows[:limit]


def extract_resume_text(file_name: str, file_bytes: bytes, content_type: str | None) -> ResumeExtractResponse:
    lower = (file_name or "").lower()
    text = ""
    file_type = "unknown"

    if lower.endswith(".txt") or lower.endswith(".md") or (content_type and "text/plain" in content_type):
        file_type = "txt"
        text = file_bytes.decode("utf-8", errors="ignore")
    elif lower.endswith(".pdf") or (content_type and "pdf" in content_type):
        file_type = "pdf"
        if PdfReader is None:
            raise ValueError("PDF extraction dependency missing: pypdf")
        reader = PdfReader(BytesIO(file_bytes))
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
    elif lower.endswith(".docx") or (content_type and "wordprocessingml.document" in content_type):
        file_type = "docx"
        if Document is None:
            raise ValueError("DOCX extraction dependency missing: python-docx")
        doc = Document(BytesIO(file_bytes))
        text = "\n".join(paragraph.text for paragraph in doc.paragraphs if paragraph.text)
    else:
        raise ValueError("Unsupported file type. Use TXT/PDF/DOCX")

    cleaned = text.strip()
    if not cleaned:
        raise ValueError("Failed to extract readable text from file")

    return ResumeExtractResponse(
        resume_name=file_name,
        extracted_text=cleaned,
        file_type=file_type,
        char_count=len(cleaned),
    )


def _extract_resume_info(payload: ResumeAnalysisRequest) -> ResumeExtractedInfo:
    rows = _pick_lines(payload.resume_text, limit=30)
    lower_rows = [r.lower() for r in rows]
    skills = [rows[i] for i, r in enumerate(lower_rows) if any(k in r for k in ("python", "sql", "excel", "java", "tableau", "figma", "powerbi"))][:6]
    projects = [rows[i] for i, r in enumerate(lower_rows) if any(k in r for k in ("project", "项目", "课题", "实践"))][:4]
    internships = [rows[i] for i, r in enumerate(lower_rows) if any(k in r for k in ("intern", "实习", "兼职", "工作经历"))][:4]
    education = [rows[i] for i, r in enumerate(lower_rows) if any(k in r for k in ("university", "college", "学校", "学院", "major", "专业"))][:3]
    candidate_name = rows[0] if rows else "候选人"

    return ResumeExtractedInfo(
        candidate_name=candidate_name[:24],
        education=education or ["教育经历待补充"],
        skills=skills or ["技能信息待补充"],
        projects=projects or ["项目经历待补充"],
        internship_experience=internships or ["实习经历待补充"],
    )


def _analyze_resume_fallback(payload: ResumeAnalysisRequest, extracted: ResumeExtractedInfo) -> ResumeAnalysisResult:
    tokens = [tok for tok in payload.target_job.replace("/", " ").split() if tok]
    text = payload.resume_text.lower()
    hit = sum(1 for tok in tokens if tok.lower() in text)
    fit = min(92.0, max(55.0, 58.0 + hit * 4.5 + min(len(extracted.skills), 5) * 2.2))

    return ResumeAnalysisResult(
        fit_score=round(fit, 1),
        fit_summary=f"目标岗位 {payload.target_job} 的匹配度为 {round(fit, 1)}，建议补充量化成果与业务场景表达。",
        highlights=["技能关键词覆盖较完整", "有可复用项目证据", "岗位方向相对明确"],
        risks=["高压追问下的结构化表达可能不足", "量化成果描述可进一步增强", "业务场景迁移能力待验证"],
        suggestions=["补充 2 个与目标岗位强关联项目", "将项目成果改写为 STAR 结构", "准备 10 个高频追问的标准回答框架"],
    )


def _save_resume_analysis(item: ResumeAnalysisResponse) -> None:
    conninfo = _conninfo()
    if not conninfo:
        return
    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO app_resume_analyses (analysis_id, student_id, payload)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (analysis_id) DO UPDATE SET payload = EXCLUDED.payload
                    """,
                    (item.analysis_id, item.student_id, json.dumps(item.model_dump(mode="json"), ensure_ascii=False)),
                )
            conn.commit()
    except Exception:  # noqa: BLE001
        return


def _save_assessment(student_id: str, item: AssessmentResult) -> None:
    conninfo = _conninfo()
    if not conninfo:
        return
    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO app_assessment_results (assessment_id, student_id, payload)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (assessment_id) DO UPDATE SET payload = EXCLUDED.payload
                    """,
                    (item.assessment_id, student_id, json.dumps(item.model_dump(mode="json"), ensure_ascii=False)),
                )
            conn.commit()
    except Exception:  # noqa: BLE001
        return


def analyze_resume(student_id: str, payload: ResumeAnalysisRequest) -> ResumeAnalysisResponse:
    extracted = _extract_resume_info(payload)
    analysis = _analyze_resume_fallback(payload, extracted)

    if should_try_real_llm():
        prompt = f"""
目标岗位: {payload.target_job}
简历文本:
{payload.resume_text[:6000]}
请输出 JSON:
{{
  "fit_score": number,
  "fit_summary": string,
  "highlights": string[],
  "risks": string[],
  "suggestions": string[]
}}
""".strip()
        llm_json, _ = llm_generate_json(
            system_prompt="你是求职简历分析助手，只返回 JSON。",
            user_prompt=prompt,
            temperature=0.2,
        )
        if isinstance(llm_json, dict):
            try:
                analysis = ResumeAnalysisResult(
                    fit_score=float(llm_json.get("fit_score", analysis.fit_score)),
                    fit_summary=str(llm_json.get("fit_summary", analysis.fit_summary)),
                    highlights=[str(x) for x in llm_json.get("highlights", analysis.highlights)],
                    risks=[str(x) for x in llm_json.get("risks", analysis.risks)],
                    suggestions=[str(x) for x in llm_json.get("suggestions", analysis.suggestions)],
                )
            except Exception:  # noqa: BLE001
                pass

    result = ResumeAnalysisResponse(
        analysis_id=f"ra_{uuid4().hex[:10]}",
        student_id=student_id,
        resume_name=payload.resume_name,
        target_job=payload.target_job,
        extracted=extracted,
        analysis=analysis,
        created_at=_now_iso(),
    )
    RESUME_ANALYSIS_STORE.setdefault(student_id, []).insert(0, result)
    _save_resume_analysis(result)
    return result


def _job_tailored_questions(target_job: str) -> list[AssessmentQuestion]:
    lower = target_job.lower()
    questions = [
        AssessmentQuestion(
            question_id="story_1",
            section="行为事件",
            prompt="请描述你最近一次推动复杂任务达成的过程，并说明你的关键动作。",
            input_type="text",
            rubric="关注目标拆解、行动闭环与结果量化。",
        ),
        AssessmentQuestion(
            question_id="story_2",
            section="行为事件",
            prompt="请复盘一次失败经历，你如何定位原因并完成迭代？",
            input_type="text",
            rubric="关注复盘深度、反思逻辑与改进有效性。",
        ),
    ]

    if any(tok in lower for tok in ("engineer", "developer", "python", "java", "算法", "开发", "后端", "前端")):
        questions.append(
            AssessmentQuestion(
                question_id="interview_code",
                section="技术实现",
                prompt="请提交一段你认为最能体现工程能力的代码并说明设计取舍。",
                input_type="code",
                rubric="关注代码质量、可维护性、边界处理与解释能力。",
            )
        )
    elif any(tok in lower for tok in ("运营", "产品", "市场", "分析", "project", "analyst")):
        questions.append(
            AssessmentQuestion(
                question_id="interview_artifact",
                section="产出物",
                prompt="请提交与你目标岗位最相关的一份产出物，并说明你的方法论。",
                input_type="artifact",
                rubric="关注问题定义、方法路径、结论可信度与复盘。",
            )
        )
    else:
        questions.append(
            AssessmentQuestion(
                question_id="interview_general",
                section="综合判断",
                prompt="请说明你为什么适合该岗位，并给出三个可验证证据。",
                input_type="text",
                rubric="关注证据质量、岗位理解与表达完整性。",
            )
        )

    return questions


def generate_assessment(student_id: str, payload: AssessmentGenerateRequest) -> AssessmentGenerateResponse:
    assessment = AssessmentGenerateResponse(
        assessment_id=f"asmt_{uuid4().hex[:10]}",
        student_id=student_id,
        target_job=payload.target_job,
        target_profile=payload.target_profile,
        questions=_job_tailored_questions(payload.target_job),
        warmup_storyline=[
            f"围绕目标岗位 {payload.target_job} 构建评估任务链。",
            "通过多轮追问验证稳定性与迁移能力。",
            "输出可直接用于投递决策的结构化结果。",
        ],
        created_at=_now_iso(),
    )
    ASSESSMENT_STORE[assessment.assessment_id] = assessment
    return assessment


def submit_assessment(student_id: str, payload: AssessmentSubmitRequest) -> AssessmentResult:
    answer_lengths = [len(item.answer.strip()) for item in payload.answers if item.answer.strip()]
    evidence_density = min(100.0, sum(min(30, size) for size in answer_lengths) / 2.4) if answer_lengths else 30.0

    dimensions = [
        AssessmentDimensionScore(dimension="业务理解", score=round(min(95.0, 52.0 + evidence_density * 0.25), 1), comment="目标与问题拆解较清晰。"),
        AssessmentDimensionScore(dimension="岗位匹配", score=round(min(94.0, 48.0 + evidence_density * 0.31), 1), comment="回答与岗位场景关联度较好。"),
        AssessmentDimensionScore(dimension="表达复盘", score=round(min(92.0, 50.0 + evidence_density * 0.2), 1), comment="表达较完整，建议增强量化复盘。"),
    ]
    overall = round(mean([item.score for item in dimensions]), 1)

    result = AssessmentResult(
        assessment_id=payload.assessment_id,
        overall_score=overall,
        summary=f"评估完成，综合得分 {overall}。",
        dimensions=dimensions,
        recommendations=[
            "补充 2 个岗位相关项目案例并量化结果。",
            "每周完成一次高压追问模拟并复盘。",
            "形成个人能力证据包，提升面试说服力。",
        ],
        created_at=_now_iso(),
    )
    _save_assessment(student_id, result)
    return result


def _simulation_digest(student_id: str) -> list[SimulationDigestItem]:
    history = get_simulation_history(student_id=student_id, limit=6)
    return [
        SimulationDigestItem(
            session_id=item.session_id,
            simulation_type=item.simulation_type,
            overall_score=item.overall_score,
            summary=item.summary,
            created_at=item.created_at,
        )
        for item in history.items
    ]


def _save_application(student_id: str, package: ApplicationPackage, app_item: StudentApplicationItem) -> None:
    conninfo = _conninfo()
    if not conninfo:
        return
    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO app_application_packages (application_id, student_id, job_id, company_id, payload)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (application_id) DO UPDATE SET payload = EXCLUDED.payload
                    """,
                    (
                        package.application_id,
                        student_id,
                        package.job_id,
                        package.company_id,
                        json.dumps(package.model_dump(mode="json"), ensure_ascii=False),
                    ),
                )
                cur.execute(
                    """
                    INSERT INTO app_student_applications (
                        id, student_id, job_id, company_id, job_title, company, status, applied_at,
                        resume_name, resume_fit_score, assessment_score, has_assessment
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        job_id = EXCLUDED.job_id,
                        company_id = EXCLUDED.company_id,
                        job_title = EXCLUDED.job_title,
                        company = EXCLUDED.company,
                        status = EXCLUDED.status,
                        resume_name = EXCLUDED.resume_name,
                        resume_fit_score = EXCLUDED.resume_fit_score,
                        assessment_score = EXCLUDED.assessment_score,
                        has_assessment = EXCLUDED.has_assessment
                    """,
                    (
                        app_item.id,
                        student_id,
                        app_item.job_id,
                        app_item.company_id,
                        app_item.job,
                        app_item.company,
                        app_item.status,
                        app_item.resume_name,
                        app_item.resume_fit_score,
                        app_item.assessment_score,
                        app_item.has_assessment,
                    ),
                )
            conn.commit()
    except Exception:  # noqa: BLE001
        return


def submit_application(student_id: str, payload: ApplicationSubmitRequest) -> ApplicationSubmitResponse:
    application_id = f"A-{datetime.now().strftime('%m%d')}-{uuid4().hex[:4].upper()}"
    submitted_at = _now_iso()
    status = "已投递"

    company_id: str | None = None
    canonical_job_title = payload.job_title
    canonical_company_name = payload.company
    conninfo = _conninfo()
    if conninfo:
        try:
            with psycopg.connect(conninfo) as conn:
                _ensure_tables(conn)
                with conn.cursor() as cur:
                    # Ensure enterprise catalog tables exist for validation
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
                        SELECT j.company_id, j.title, c.name
                        FROM app_enterprise_jobs j
                        LEFT JOIN app_enterprise_companies c ON c.company_id = j.company_id
                        WHERE j.job_id = %s
                        """,
                        (payload.job_id,),
                    )
                    row = cur.fetchone()
                    if not row:
                        raise ValueError("岗位不存在或已下架，请从岗位推荐/岗位列表重新选择后投递")
                    company_id = str(row[0]) if row[0] else None
                    canonical_job_title = str(row[1]) if row[1] else canonical_job_title
                    canonical_company_name = str(row[2]) if row[2] else canonical_company_name
        except ValueError:
            raise
        except Exception:  # noqa: BLE001
            # DB 校验失败时仍允许走 demo 流程，但不写入 company_id
            company_id = None

    app_item = StudentApplicationItem(
        id=application_id,
        job_id=payload.job_id,
        company_id=company_id,
        job=canonical_job_title,
        company=canonical_company_name,
        status=status,
        date=submitted_at[:10],
        resume_name=payload.resume_name,
        resume_fit_score=payload.resume_analysis.analysis.fit_score,
        assessment_score=payload.assessment_result.overall_score,
        has_assessment=True,
    )
    package = ApplicationPackage(
        application_id=application_id,
        student_id=student_id,
        job_id=payload.job_id,
        company_id=company_id,
        job_title=canonical_job_title,
        company=canonical_company_name,
        status=status,
        submitted_at=submitted_at,
        resume_name=payload.resume_name,
        resume_text=payload.resume_text,
        resume_analysis=payload.resume_analysis,
        assessment_result=payload.assessment_result,
        simulation_digest=_simulation_digest(student_id),
    )

    APPLICATION_PACKAGE_STORE.setdefault(student_id, []).insert(0, package)
    _save_application(student_id, package, app_item)
    return ApplicationSubmitResponse(student_id=student_id, application=app_item, package=package)


def get_student_application_items(student_id: str) -> list[StudentApplicationItem]:
    conninfo = _conninfo()
    if conninfo:
        try:
            with psycopg.connect(conninfo) as conn:
                _ensure_tables(conn)
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT id, job_id, company_id, job_title, company, status, applied_at,
                               resume_name, resume_fit_score, assessment_score, has_assessment
                        FROM app_student_applications
                        WHERE student_id = %s
                        ORDER BY applied_at DESC
                        """,
                        (student_id,),
                    )
                    rows = cur.fetchall()

            if rows:
                return [
                    StudentApplicationItem(
                        id=row[0],
                        job_id=(str(row[1]) if row[1] is not None else None),
                        company_id=(str(row[2]) if row[2] is not None else None),
                        job=row[3],
                        company=row[4],
                        status=row[5],
                        date=(row[6].strftime("%Y-%m-%d") if isinstance(row[6], datetime) else str(row[6])[:10]),
                        resume_name=row[7],
                        resume_fit_score=(float(row[8]) if row[8] is not None else None),
                        assessment_score=(float(row[9]) if row[9] is not None else None),
                        has_assessment=bool(row[10]),
                    )
                    for row in rows
                ]
        except Exception:  # noqa: BLE001
            pass

    packages = APPLICATION_PACKAGE_STORE.get(student_id, [])
    return [
        StudentApplicationItem(
            id=item.application_id,
            job_id=item.job_id,
            company_id=item.company_id,
            job=item.job_title,
            company=item.company,
            status=item.status,
            date=item.submitted_at[:10],
            resume_name=item.resume_name,
            resume_fit_score=item.resume_analysis.analysis.fit_score,
            assessment_score=item.assessment_result.overall_score,
            has_assessment=True,
        )
        for item in packages
    ]


def get_latest_resume_snapshot(student_id: str) -> ResumeSnapshot | None:
    conninfo = _conninfo()
    if conninfo:
        try:
            with psycopg.connect(conninfo) as conn:
                _ensure_tables(conn)
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT payload
                        FROM app_resume_analyses
                        WHERE student_id = %s
                        ORDER BY created_at DESC
                        LIMIT 1
                        """,
                        (student_id,),
                    )
                    row = cur.fetchone()
            if row:
                payload = row[0] if isinstance(row[0], dict) else json.loads(row[0])
                latest = ResumeAnalysisResponse.model_validate(payload)
                return ResumeSnapshot(
                    resume_name=latest.resume_name,
                    target_job=latest.target_job,
                    fit_score=latest.analysis.fit_score,
                    fit_summary=latest.analysis.fit_summary,
                    created_at=latest.created_at,
                )
        except Exception:  # noqa: BLE001
            pass

    items = RESUME_ANALYSIS_STORE.get(student_id, [])
    if not items:
        return None
    latest = items[0]
    return ResumeSnapshot(
        resume_name=latest.resume_name,
        target_job=latest.target_job,
        fit_score=latest.analysis.fit_score,
        fit_summary=latest.analysis.fit_summary,
        created_at=latest.created_at,
    )


def get_enterprise_application_packages(student_id: str, company_id: str | None = None) -> list[ApplicationPackage]:
    conninfo = _conninfo()
    if conninfo:
        try:
            with psycopg.connect(conninfo) as conn:
                _ensure_tables(conn)
                with conn.cursor() as cur:
                    if company_id:
                        cur.execute(
                            """
                            SELECT payload
                            FROM app_application_packages
                            WHERE student_id = %s AND company_id = %s
                            ORDER BY created_at DESC
                            """,
                            (student_id, company_id),
                        )
                    else:
                        cur.execute(
                            """
                            SELECT payload
                            FROM app_application_packages
                            WHERE student_id = %s
                            ORDER BY created_at DESC
                            """,
                            (student_id,),
                        )
                    rows = cur.fetchall()

            if rows:
                packages: list[ApplicationPackage] = []
                for (payload,) in rows:
                    parsed = payload if isinstance(payload, dict) else json.loads(payload)
                    packages.append(ApplicationPackage.model_validate(parsed))
                return packages
        except Exception:  # noqa: BLE001
            pass

    packs = APPLICATION_PACKAGE_STORE.get(student_id, [])
    if not company_id:
        return packs
    return [p for p in packs if (p.company_id == company_id or p.company_id is None)]


def list_enterprise_applications(
    company_id: str,
    job_id: str | None = None,
    status: str | None = None,
    keyword: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    conninfo = _conninfo()
    if conninfo:
        try:
            with psycopg.connect(conninfo) as conn:
                _ensure_tables(conn)
                with conn.cursor() as cur:
                    where = ["company_id = %s"]
                    params: list[object] = [company_id]
                    if job_id:
                        where.append("job_id = %s")
                        params.append(job_id)
                    if status:
                        where.append("status = %s")
                        params.append(status)
                    if keyword:
                        where.append("(student_id ILIKE %s OR job_title ILIKE %s OR company ILIKE %s)")
                        kw = f"%{keyword}%"
                        params.extend([kw, kw, kw])
                    where_sql = " AND ".join(where)
                    cur.execute(
                        f"""
                        SELECT id, student_id, job_id, company_id, job_title, company, status, applied_at,
                               resume_name, resume_fit_score, assessment_score
                        FROM app_student_applications
                        WHERE {where_sql}
                        ORDER BY applied_at DESC
                        LIMIT %s OFFSET %s
                        """,
                        (*params, limit, offset),
                    )
                    rows = cur.fetchall()
            items: list[dict] = []
            for row in rows:
                applied_at = row[7]
                items.append(
                    {
                        "application_id": str(row[0]),
                        "student_id": str(row[1]),
                        "job_id": (str(row[2]) if row[2] is not None else None),
                        "company_id": (str(row[3]) if row[3] is not None else None),
                        "job_title": str(row[4]),
                        "company": str(row[5]),
                        "status": str(row[6]),
                        "applied_at": (applied_at.isoformat() if isinstance(applied_at, datetime) else str(applied_at)),
                        "resume_name": (str(row[8]) if row[8] is not None else None),
                        "resume_fit_score": (float(row[9]) if row[9] is not None else None),
                        "assessment_score": (float(row[10]) if row[10] is not None else None),
                    }
                )
            return items
        except Exception:  # noqa: BLE001
            return []

    # no DB: best-effort scan in-memory packages
    items: list[dict] = []
    for _sid, packs in APPLICATION_PACKAGE_STORE.items():
        for p in packs:
            if p.company_id and p.company_id != company_id:
                continue
            if job_id and p.job_id != job_id:
                continue
            if status and p.status != status:
                continue
            if keyword and keyword not in (p.student_id + p.job_title + p.company):
                continue
            items.append(
                {
                    "application_id": p.application_id,
                    "student_id": p.student_id,
                    "job_id": p.job_id,
                    "company_id": p.company_id,
                    "job_title": p.job_title,
                    "company": p.company,
                    "status": p.status,
                    "applied_at": p.submitted_at,
                    "resume_name": p.resume_name,
                    "resume_fit_score": p.resume_analysis.analysis.fit_score,
                    "assessment_score": p.assessment_result.overall_score,
                }
            )
    return items[offset : offset + limit]


def get_application_package_by_id(application_id: str) -> ApplicationPackage | None:
    conninfo = _conninfo()
    if conninfo:
        try:
            with psycopg.connect(conninfo) as conn:
                _ensure_tables(conn)
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT payload
                        FROM app_application_packages
                        WHERE application_id = %s
                        LIMIT 1
                        """,
                        (application_id,),
                    )
                    row = cur.fetchone()
            if row:
                payload = row[0] if isinstance(row[0], dict) else json.loads(row[0])
                return ApplicationPackage.model_validate(payload)
        except Exception:  # noqa: BLE001
            return None

    for packs in APPLICATION_PACKAGE_STORE.values():
        for p in packs:
            if p.application_id == application_id:
                return p
    return None
