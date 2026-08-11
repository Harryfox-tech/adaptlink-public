from __future__ import annotations

import json

from app.schemas.resume_optimizer import (
    ResumeOptimizeIteration,
    ResumeOptimizeRequest,
    ResumeOptimizeResponse,
    SimulationAutoRunRequest,
)
from app.services.agent_llm_service import llm_generate_json, llm_generate_text, should_try_real_llm
from app.services.simulation_auto_run_service import run_auto_simulation


def _apply_modifications_mock(resume: str, weak: list[str], target_job: str) -> tuple[str, list[str]]:
    log: list[str] = []
    updated = resume
    if weak:
        keyword = weak[0].replace("能力", "").strip() or target_job
        addition = f"\n\n【Agent 优化】补充与「{keyword}」相关的量化成果与项目关键词，以提升岗位匹配度。"
        if addition.strip() not in updated:
            updated = updated.rstrip() + addition
            log.append(f"追加关键词段落：{keyword}")
    else:
        addition = f"\n\n【Agent 优化】明确写出与 {target_job} 匹配的工具链、指标与结果数据。"
        updated = updated.rstrip() + addition
        log.append("追加通用量化建议段落")
    return updated, log


def _apply_modifications_llm(resume: str, suggestions: list[str]) -> tuple[str, list[str], str | None]:
    system_prompt = "你是简历优化专家。输出完整修改后的简历正文，不要 Markdown 代码块。"
    user_prompt = f"""
原简历：
{resume[:4000]}

修改建议：
{json.dumps(suggestions, ensure_ascii=False)}

请输出应用建议后的完整简历。
""".strip()
    text, err = llm_generate_text(system_prompt=system_prompt, user_prompt=user_prompt, temperature=0.35)
    if text:
        return text.strip(), [f"LLM 应用 {len(suggestions)} 条建议"], None
    updated, log = _apply_modifications_mock(resume, [], "")
    return updated, log, err


def _generate_modifications_llm(resume: str, weak: list[str], reviews_summary: str, target_job: str) -> tuple[list[str], str | None]:
    system_prompt = "你是简历优化专家。输出严格 JSON。"
    user_prompt = f"""
目标岗位：{target_job}
薄弱维度：{json.dumps(weak, ensure_ascii=False)}
评审摘要：{reviews_summary[:800]}
当前简历节选：{resume[:1500]}

输出 JSON: {{"modifications": ["建议1", "建议2", ...]}}，3-5 条具体可执行建议。
""".strip()
    data, err = llm_generate_json(system_prompt=system_prompt, user_prompt=user_prompt, temperature=0.3)
    if data and isinstance(data.get("modifications"), list):
        return [str(x) for x in data["modifications"][:5]], None
    return [], err


def optimize_resume(payload: ResumeOptimizeRequest) -> ResumeOptimizeResponse:
    best_resume = payload.original_resume.strip()
    history: list[ResumeOptimizeIteration] = []
    modification_log: list[str] = []
    engine = "mock"
    original_score = 0.0
    best_score = 0.0
    last_suggestions: list[str] = []

    for i in range(payload.iterations):
        run_result = run_auto_simulation(
            SimulationAutoRunRequest(
                student_id=payload.student_id,
                resume_content=best_resume,
                target_job=payload.target_job,
                simulation_type="job",
                player_strategy=payload.player_strategy,
            )
        )
        if run_result.engine == "openai":
            engine = "openai"

        score = run_result.overall_score
        if i == 0:
            original_score = score
        if score > best_score:
            best_score = score

        history.append(
            ResumeOptimizeIteration(
                iteration=i + 1,
                overall_score=score,
                weak_dimensions=run_result.weak_dimensions,
                resume_preview=best_resume[:120] + ("…" if len(best_resume) > 120 else ""),
            )
        )
        last_suggestions = run_result.suggested_resume_modifications
        modification_log.append(f"第{i + 1}轮模拟得分 {score}，薄弱项：{', '.join(run_result.weak_dimensions) or '无'}")

        if best_score >= payload.score_target:
            modification_log.append(f"达到目标分数 {payload.score_target}，提前结束。")
            break

        if i >= payload.iterations - 1:
            break

        reviews_summary = " ".join(r.summary for r in run_result.agent_reviews[:3])
        mods: list[str] = run_result.suggested_resume_modifications

        if should_try_real_llm():
            llm_mods, err = _generate_modifications_llm(
                best_resume, run_result.weak_dimensions, reviews_summary, payload.target_job
            )
            if llm_mods:
                mods = llm_mods
            elif err:
                modification_log.append(f"建议生成回退：{err}")

        if should_try_real_llm() and mods:
            best_resume, apply_log, apply_err = _apply_modifications_llm(best_resume, mods)
            if apply_err:
                modification_log.append(f"改写回退：{apply_err}")
        else:
            best_resume, apply_log = _apply_modifications_mock(
                best_resume, run_result.weak_dimensions, payload.target_job
            )
        modification_log.extend(apply_log)

    return ResumeOptimizeResponse(
        optimized_resume=best_resume,
        original_score=original_score,
        final_score=best_score,
        improvement_history=history,
        modification_log=modification_log,
        suggested_resume_modifications=last_suggestions,
        engine=engine,
        reasoning_trace=[],
    )
