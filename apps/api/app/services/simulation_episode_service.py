from __future__ import annotations

import json
import random
from datetime import datetime
import re
from typing import Literal
from uuid import uuid4

import psycopg

from app.core.db import get_psycopg_conninfo
from app.schemas.common import SimulationMessage
from app.schemas.simulations import (
    EpisodeActionRequest,
    EpisodeActionResponse,
    EpisodeDialogueMessage,
    EpisodeDialogueRequest,
    EpisodeDialogueResponse,
    EpisodeEnding,
    EpisodeEvent,
    EpisodeStartRequest,
    EpisodeState,
    EpisodeTurnResult,
    SimulationEpisode,
    SimulationStartRequest,
)
from app.services.agent_llm_service import llm_generate_json, llm_generate_text, should_try_real_llm
from app.services.simulation_service import run_simulation_and_persist

EPISODE_STORE: dict[str, SimulationEpisode] = {}


def _clamp(value: int, low: int = 0, high: int = 100) -> int:
    return max(low, min(high, value))


def _now_iso() -> str:
    return datetime.utcnow().isoformat()


def _short_target(target: str, fallback: str = "当前目标") -> str:
    cleaned = " ".join((target or "").replace("\n", " ").split())
    if not cleaned:
        return fallback
    return cleaned[:42]


def _target_profile(target: str) -> dict[str, str]:
    profile = {
        "role": _short_target(target, "关键挑战者"),
        "goal": "在真实压力下完成一次关键任务",
        "strength": "已有一定执行和协作基础",
        "challenge": "表达、取舍和现场应变仍会被持续检验",
        "success": "形成可复盘、可执行、可被他人认可的结果",
    }

    normalized = (target or "").replace("；", ";").replace("，", ";").replace(",", ";")
    for raw in normalized.split(";"):
        if "：" not in raw and ":" not in raw:
            continue
        key, value = raw.replace(":", "：", 1).split("：", 1)
        value = value.strip()
        if not value or value in {"1", "无", "暂无", "none", "None"}:
            continue
        if "目标角色" in key:
            profile["role"] = value
        elif "场景目标" in key:
            profile["goal"] = value
        elif "优势证据" in key:
            profile["strength"] = value
        elif "挑战边界" in key:
            profile["challenge"] = value
        elif "成功标准" in key:
            profile["success"] = value

    return profile


def _plain_goal(target: str) -> str:
    profile = _target_profile(target)
    goal = profile["goal"]
    if "目标角色" in goal or "场景目标" in goal:
        parts = re.split(r"[;；,，]", target or "")
        for part in parts:
            if "场景目标" in part and ("：" in part or ":" in part):
                return part.replace(":", "：", 1).split("：", 1)[1].strip() or "完成一次关键挑战"
    return goal or _short_target(target, "完成一次关键挑战")


def _scenario_domain(profile: dict[str, str]) -> str:
    text = " ".join(profile.values()).lower()
    if any(word in text for word in ["恋爱", "对象", "结婚", "婚姻", "分手", "复合", "告白", "伴侣", "情侣", "关系"]):
        return "relationship"
    if any(word in text for word in ["面试", "求职", "岗位", "offer", "简历", "入职", "hr"]):
        return "job"
    if any(word in text for word in ["保研", "考研", "绩点", "成绩", "排名", "论文", "科研", "竞赛", "导师", "课程", "考试", "奖学金"]):
        return "academic"
    if any(word in text for word in ["项目", "活动", "路演", "团队", "社团", "组织", "负责人", "协作", "资源", "预算"]):
        return "project"
    return "generic"


def _event_description(
    *,
    target: str,
    role: str,
    goal: str,
    strength: str,
    challenge: str,
    success: str,
    stage_label: str,
    pressure: str,
    conflict: str,
    observer: str,
    previous_note: str,
) -> str:
    intro = (
        f"目标角色：{role}。你的主线目标是：{goal}。"
        f"这一幕进入“{stage_label}”，场景不再只是给出一个选择，而是在检验你能否把目标落到真实行动里。"
    )
    setup = (
        f"{previous_note}{pressure}"
        f"你原本可以依赖的优势是：{strength}；但现在真正暴露出来的挑战是：{challenge}。"
    )
    tension = (
        f"{conflict}"
        f"{observer}没有急着给你答案，而是在观察你如何排序：先澄清事实，先处理关键短板，还是先争取外部反馈。"
    )
    stakes = (
        f"如果你的选择只停留在口号，局面会继续停滞；如果你能给出清晰动作，目标会变得更可验证。"
        f"本幕的成功标准是：{success}。"
    )
    return "\n\n".join([intro, setup, tension, stakes])


def _relationship_description(
    *,
    role: str,
    goal: str,
    strength: str,
    challenge: str,
    success: str,
    stage_label: str,
    pressure: str,
    conflict: str,
    previous_note: str,
) -> str:
    intro = (
        f"目标角色：{role}。你的关系目标是：{goal}。"
        f"这一幕进入“{stage_label}”，重点不是完成任务，而是看你如何在亲密关系里表达需求、识别边界并承担选择后果。"
    )
    setup = (
        f"{previous_note}{pressure}"
        f"你目前可依赖的优势是：{strength}；真正容易卡住你的地方是：{challenge}。"
    )
    tension = (
        f"{conflict}"
        f"对方不会因为你有目标就自动配合，关系也不会因为你用力推进就变稳定。你需要判断：此刻该靠近、澄清、等待，还是承认不合适。"
    )
    stakes = (
        f"如果你只想控制结果，关系会变得更紧；如果你能同时照顾真实感受和边界，局面会更清楚。"
        f"本幕的成功标准是：{success}。"
    )
    return "\n\n".join([intro, setup, tension, stakes])


def _opening_line(stage: int, npc_role: str, goal: str, challenge: str, success: str) -> str:
    prompts = {
        1: (
            f"{npc_role}压低声音问你：现在大家都在等第一个动作。"
            f"你准备先抓住哪个关键点？请不要只说方向，告诉我你会怎么让别人相信这一步真的能推进“{goal}”。"
        ),
        2: (
            f"{npc_role}把临时变更推到你面前：条件已经变了。"
            f"你要牺牲什么、保住什么、找谁协同？如果你判断错了，{challenge}会立刻放大。"
        ),
        3: (
            f"{npc_role}看着现场的分歧说：现在不是所有人都愿意跟你走。"
            f"你要如何处理反对声音，同时不让目标失焦？"
        ),
        4: (
            f"{npc_role}要求你做最终说明：我不只要听结果。"
            f"请说清楚你一路上最关键的选择、代价、证据，以及你是否达到了“{success}”。"
        ),
    }
    return prompts.get(stage, prompts[4])


def _relationship_opening_line(stage: int, npc_role: str, goal: str, challenge: str, success: str) -> str:
    prompts = {
        1: (
            f"{npc_role}看着你，语气不算冷，但也没有给出明确承诺："
            f"“你说你想要‘{goal}’，那你先告诉我，你是真的了解我，还是只是想快点得到一个结果？”"
        ),
        2: (
            f"{npc_role}停顿了一下："
            f"“如果我们继续聊下去，你能不能把你的期待讲清楚？我不想被推进一个我还没准备好的关系里。”"
        ),
        3: (
            f"{npc_role}的情绪明显起来："
            f"“你说你在乎我，可是遇到‘{challenge}’的时候，你会怎么处理？靠哄，靠承诺，还是靠真的改变？”"
        ),
        4: (
            f"{npc_role}最后问你："
            f"“如果结果不是你想要的，你还会尊重我的选择吗？你怎么证明你理解‘{success}’不是单方面达成？”"
        ),
    }
    return prompts.get(stage, prompts[4])


def _relationship_event(
    *,
    profile: dict[str, str],
    target: str,
    stage: int,
    previous_note: str,
    rng: random.Random,
) -> tuple[str, str, list[str], str, str, str]:
    role = profile["role"]
    goal = profile["goal"]
    strength = profile["strength"]
    challenge = profile["challenge"]
    success = profile["success"]
    arcs = {
        1: (
            f"{target}：初次靠近",
            _relationship_description(
                role=role,
                goal=goal,
                strength=strength,
                challenge=challenge,
                success=success,
                stage_label="初次靠近",
                pressure="你终于有机会和对方单独相处。气氛并不尴尬，但也远没有到可以直接谈未来的程度。",
                conflict="你想表达好感，又担心太急；你想展示真诚，又怕变成自我推销。",
                previous_note=previous_note,
            ),
            ["先真诚了解对方近况", "直接表达想进一步认识", "用玩笑试探对方态度", "先隐藏目的保持轻松", "询问对方对关系的期待"],
            "对方",
            "判断你的靠近是真诚了解，还是急于获得关系结果",
            _relationship_opening_line(1, "对方", goal, challenge, success),
        ),
        2: (
            f"{target}：期待澄清",
            _relationship_description(
                role=role,
                goal=goal,
                strength=strength,
                challenge=challenge,
                success=success,
                stage_label="期待澄清",
                pressure="你们的交流变多了，但对方没有给出明确关系定位。你开始在期待和不确定之间摇摆。",
                conflict="如果你逼问关系，对方可能退后；如果你一直不说，误解和消耗会继续增加。",
                previous_note=previous_note,
            ),
            ["说明自己的期待但不施压", "询问对方是否愿意继续了解", "用行动制造更多相处机会", "故意冷淡测试对方反应", "先承认自己的不安"],
            "对方",
            "确认双方期待是否一致，以及你能否尊重节奏差异",
            _relationship_opening_line(2, "对方", goal, challenge, success),
        ),
        3: (
            f"{target}：矛盾显影",
            _relationship_description(
                role=role,
                goal=goal,
                strength=strength,
                challenge=challenge,
                success=success,
                stage_label="矛盾显影",
                pressure="一次误会让气氛变得微妙。对方觉得你有些急，你又觉得自己一直在付出却得不到回应。",
                conflict="现在真正要处理的不是表白技巧，而是边界、沟通方式和情绪承担。",
                previous_note=previous_note,
            ),
            ["先复述对方感受再表达自己", "道歉并说明具体调整", "要求对方给明确答案", "暂时后退给彼此空间", "把问题摊开讨论边界"],
            "对方",
            "观察你能否在情绪里保持尊重和清晰",
            _relationship_opening_line(3, "对方", goal, challenge, success),
        ),
        4: (
            f"{target}：关系选择",
            _relationship_description(
                role=role,
                goal=goal,
                strength=strength,
                challenge=challenge,
                success=success,
                stage_label="关系选择",
                pressure="你们终于谈到关系的可能性。这个时刻不再适合包装，也不能靠冲动推进。",
                conflict="对方需要确认：你想要的是一个真实的人，还是一个满足你目标的答案。",
                previous_note=previous_note,
            ),
            ["表达愿意慢慢建立关系", "尊重对方选择并保留体面", "提出具体相处约定", "用强烈承诺争取对方", "承认不合适并停止推进"],
            "对方",
            "判断这段关系是否能在尊重、边界和真实期待中继续",
            _relationship_opening_line(4, "对方", goal, challenge, success),
        ),
    }
    title, desc, choices, npc_role, npc_goal, opening_line = arcs.get(stage, arcs[4])
    if rng.random() < 0.25:
        rng.shuffle(choices)
    return title, desc, choices, npc_role, npc_goal, opening_line


def _adaptive_event(
    *,
    profile: dict[str, str],
    target: str,
    stage: int,
    domain: str,
    previous_note: str,
    rng: random.Random,
) -> tuple[str, str, list[str], str, str, str]:
    role = profile["role"]
    goal = profile["goal"]
    strength = profile["strength"]
    challenge = profile["challenge"]
    success = profile["success"]

    if domain == "academic":
        npc_role = "导师"
        npc_goal = "判断你的学业规划、短板修正和持续投入是否足以支撑目标"
        stage_pack = {
            1: (
                "差距诊断",
                "你把目标摊开后，最先浮现的不是热血，而是差距：成绩、科研、竞赛、推荐关系或时间安排里，总有一块不够稳。",
                "导师没有急着鼓励你，而是要求你先把短板说清楚。保研不是一句想要，而是一套证据链。",
                ["拆解保研条件和差距", "先补最薄弱课程", "联系导师确认方向", "用刻苦态度争取机会", "制定四周冲刺计划"],
            ),
            2: (
                "资源争取",
                "你开始寻找能补足竞争力的资源：课程成绩、科研机会、竞赛证明、老师推荐或同伴信息。",
                "问题是，每一种资源都需要时间交换。你必须判断什么最能改变结果，而不是把所有事都同时抓住。",
                ["优先提高核心成绩", "争取科研助理机会", "准备竞赛或项目材料", "找学长学姐校准信息", "暂停低价值事务"],
            ),
            3: (
                "压力波动",
                "一次测验、排名或材料反馈让你开始怀疑自己。身边有人进展更快，你的焦虑被放大。",
                "导师关心的不是你会不会焦虑，而是你能否在焦虑中继续做正确的动作。",
                ["复盘失分原因并重排计划", "向老师请教具体改进点", "和同伴建立互相监督", "硬撑原计划不调整", "先暂停一天恢复状态"],
            ),
            4: (
                "最终陈述",
                "到了要提交材料或面谈的阶段，你必须把自己的成长证据组织成一条清楚的线。",
                "评审不会只看愿望，而会看你是否真的把短板补上，并能解释为什么你值得这个机会。",
                ["用证据串联成长路径", "坦诚短板并给后续计划", "突出科研与课程匹配", "只强调自己很努力", "请求导师给最后反馈"],
            ),
        }
    else:
        npc_role = "情境观察者"
        npc_goal = "判断你能否把个人目标拆成清晰选择，并承担选择后果"
        stage_pack = {
            1: (
                "目标澄清",
                "你设定了一个不属于固定模板的目标，系统先把它还原成一个真实处境：你想达成某个结果，但信息、能力和外部反馈还不完整。",
                "此刻最重要的不是马上冲刺，而是弄清楚目标到底意味着什么、谁会受影响、第一步应该验证什么。",
                ["澄清目标背后的真实需求", "列出当前最大阻碍", "先做一次小规模尝试", "寻求关键人物反馈", "直接全力推进"],
            ),
            2: (
                "现实摩擦",
                "当你开始行动，现实阻力出现了：时间不够、信息不足、他人态度暧昧，或者你自己的信心开始摇摆。",
                "这个阶段会检验你是否能调整路径，而不是把目标当成一句固定口号。",
                ["缩小目标做可验证版本", "补齐最关键的信息", "调整节奏避免过度消耗", "请外部支持介入", "坚持原计划不变"],
            ),
            3: (
                "冲突选择",
                "你的目标和现实之间出现冲突。继续推进会有代价，后退也会有损失。",
                "现在需要你做一次更清醒的选择：是争取、修正、等待，还是承认目标本身需要改变。",
                ["重新定义成功标准", "承担代价继续推进", "暂停并观察反馈", "改变策略重新尝试", "放弃当前路径"],
            ),
            4: (
                "结果复盘",
                "行动进入收束，你需要面对结果：它可能达成、部分达成，也可能暴露了新的问题。",
                "真正的成长不是结果漂亮，而是你能否从选择中提炼出下一次更好的行动方式。",
                ["总结关键证据和变化", "承认误判并修正目标", "保留有效策略继续迭代", "只看最终成败", "向关键人物复盘"],
            ),
        }

    stage_label, pressure, conflict, choices = stage_pack.get(stage, stage_pack[4])
    desc = _event_description(
        target=target,
        role=role,
        goal=goal,
        strength=strength,
        challenge=challenge,
        success=success,
        stage_label=stage_label,
        pressure=pressure,
        conflict=conflict,
        observer=npc_role,
        previous_note=previous_note,
    )
    opening_line = (
        f"{npc_role}追问你：你的目标是“{goal}”。"
        f"现在请你做一个具体选择，不要只说想法。你准备用哪一步处理“{challenge}”，并证明它能靠近“{success}”？"
    )
    if rng.random() < 0.25:
        rng.shuffle(choices)
    return f"{target}：{stage_label}", desc, choices, npc_role, npc_goal, opening_line


def _goal_driven_event(episode: SimulationEpisode, rng: random.Random) -> EpisodeEvent:
    profile = _target_profile(episode.target)
    target = _short_target(_plain_goal(episode.target), "完成一次关键挑战")
    role = profile["role"]
    goal = profile["goal"]
    strength = profile["strength"]
    challenge = profile["challenge"]
    success = profile["success"]
    stage = episode.current_stage
    domain = _scenario_domain(profile)
    is_job = episode.simulation_type == "job" or domain == "job"
    previous_choice = episode.turns[-1].choice if episode.turns else ""
    previous_note = f"上一轮你选择了“{previous_choice}”，这个决定正在影响现场气氛。" if previous_choice else ""

    if domain == "relationship":
        title, desc, choices, npc_role, npc_goal, opening_line = _relationship_event(
            profile=profile,
            target=target,
            stage=stage,
            previous_note=previous_note,
            rng=rng,
        )
        return EpisodeEvent(
            id=f"evt_{stage}_{uuid4().hex[:6]}",
            stage=stage,
            title=title,
            description=desc,
            choices=choices,
            npc_role=npc_role,
            npc_goal=npc_goal,
            opening_line=opening_line,
        )

    if domain in {"academic", "generic"}:
        title, desc, choices, npc_role, npc_goal, opening_line = _adaptive_event(
            profile=profile,
            target=target,
            stage=stage,
            domain=domain,
            previous_note=previous_note,
            rng=rng,
        )
        return EpisodeEvent(
            id=f"evt_{stage}_{uuid4().hex[:6]}",
            stage=stage,
            title=title,
            description=desc,
            choices=choices,
            npc_role=npc_role,
            npc_goal=npc_goal,
            opening_line=opening_line,
        )

    if is_job:
        arcs = {
            1: (
                f"{target}：入场压力",
                _event_description(
                    target=target,
                    role=role,
                    goal=goal,
                    strength=strength,
                    challenge=challenge,
                    success=success,
                    stage_label="入场压力",
                    pressure="面试刚开始，对方没有寒暄，直接要求你证明自己为什么值得进入下一轮。",
                    conflict="简历上的经历被快速扫过，面试官更关心你能否把经历转成岗位价值。",
                    observer="面试官",
                    previous_note=previous_note,
                ),
                "面试官",
                "快速识别你的岗位理解、表达结构和真实准备度",
                _opening_line(1, "面试官", goal, challenge, success),
                [
                    f"用岗位需求拆解“{target}”",
                    "先讲一个最能证明能力的项目",
                    "反问面试官确认评价标准",
                    "泛泛介绍个人优点",
                    "先承认短板再给补强计划",
                ],
            ),
            2: (
                f"{target}：业务追问",
                _event_description(
                    target=target,
                    role=role,
                    goal=goal,
                    strength=strength,
                    challenge=challenge,
                    success=success,
                    stage_label="业务追问",
                    pressure="对方抓住你上一轮回答里的一个细节继续追问，要求你把判断拆成流程、指标和第一步动作。",
                    conflict="如果真实业务结果没有达到预期，你不能只解释原因，还要说明如何调整方案。",
                    observer="业务负责人",
                    previous_note=previous_note,
                ),
                "业务负责人",
                "测试你能否把目标拆成可执行动作",
                _opening_line(2, "业务负责人", goal, challenge, success),
                [
                    "拆成用户、渠道、转化三层排查",
                    "先拿数据验证最大问题点",
                    "召集团队共创备选方案",
                    "先承诺加班推进",
                    "先定义暂停线和复盘节点",
                ],
            ),
            3: (
                f"{target}：压力反驳",
                _event_description(
                    target=target,
                    role=role,
                    goal=goal,
                    strength=strength,
                    challenge=challenge,
                    success=success,
                    stage_label="压力反驳",
                    pressure="对方连续否定你的方案，房间里的节奏突然变快，你的每一句话都会被继续追问。",
                    conflict="你需要在压力下守住核心逻辑，同时证明自己不是固执，而是能基于反馈快速迭代。",
                    observer="压力面试官",
                    previous_note=previous_note,
                ),
                "压力面试官",
                "观察你面对否定时是否能稳定迭代",
                _opening_line(3, "压力面试官", goal, challenge, success),
                [
                    "先复述质疑再调整假设",
                    "用已有证据守住关键判断",
                    "承认不足并给补救计划",
                    "坚持原方案不让步",
                    "请求限定条件后重新作答",
                ],
            ),
            4: (
                f"{target}：最终选择",
                _event_description(
                    target=target,
                    role=role,
                    goal=goal,
                    strength=strength,
                    challenge=challenge,
                    success=success,
                    stage_label="最终选择",
                    pressure="终面来到最后一问，对方要求你把前面所有回答收束成一个可信的行动计划。",
                    conflict="你必须证明自己既能理解岗位，也能承担入场后的真实压力。",
                    observer="终面评审",
                    previous_note=previous_note,
                ),
                "终面评审",
                "判断你是否具备成熟的行动计划和长期匹配度",
                _opening_line(4, "终面评审", goal, challenge, success),
                [
                    "给出30天分阶段计划",
                    "先锁定一个可量化胜利",
                    "说明风险和求助机制",
                    "只强调自己学习能力强",
                    "把岗位目标转成周计划",
                ],
            ),
        }
    else:
        arcs = {
            1: (
                f"{target}：局势开端",
                _event_description(
                    target=target,
                    role=role,
                    goal=goal,
                    strength=strength,
                    challenge=challenge,
                    success=success,
                    stage_label="局势开端",
                    pressure="行动刚刚启动，现场出现分工不清、资源不足和意见分裂。所有人都在等你先表态。",
                    conflict="有同学想马上开干，有同学担心责任不清，还有人只想等老师拍板。",
                    observer="项目负责人",
                    previous_note=previous_note,
                ),
                "项目负责人",
                "看你是否能把目标转成第一步行动",
                _opening_line(1, "项目负责人", goal, challenge, success),
                [
                    "先明确目标和分工边界",
                    "主动接管最混乱的环节",
                    "找关键同伴建立小组",
                    "先观察大家真实态度",
                    "先做一次公开风险盘点",
                ],
            ),
            2: (
                f"{target}：资源受限",
                _event_description(
                    target=target,
                    role=role,
                    goal=goal,
                    strength=strength,
                    challenge=challenge,
                    success=success,
                    stage_label="资源受限",
                    pressure="推进到一半，预算、人手或时间突然被压缩。原计划无法照搬。",
                    conflict="团队开始出现不同声音：有人主张降级目标，有人想硬撑，还有人担心失败后责任归属。",
                    observer="指导老师",
                    previous_note=previous_note,
                ),
                "指导老师",
                "评估你在资源受限时的取舍能力",
                _opening_line(2, "指导老师", goal, challenge, success),
                [
                    "缩小范围保核心成果",
                    "争取外部资源补缺口",
                    "重排优先级并同步团队",
                    "维持原计划硬推进",
                    "设立最低可交付版本",
                ],
            ),
            3: (
                f"{target}：冲突升级",
                _event_description(
                    target=target,
                    role=role,
                    goal=goal,
                    strength=strength,
                    challenge=challenge,
                    success=success,
                    stage_label="冲突升级",
                    pressure="团队里出现反对声音，有人认为目标不现实，也有人开始推卸责任。气氛变得紧张。",
                    conflict="如果你压得太硬，协作会断裂；如果你退得太多，目标会失焦。",
                    observer="团队核心成员",
                    previous_note=previous_note,
                ),
                "团队核心成员",
                "判断你是否能处理冲突并维持协作",
                _opening_line(3, "团队核心成员", goal, challenge, success),
                [
                    "公开拆解分歧并定规则",
                    "私下沟通关键反对者",
                    "用阶段成果稳定信心",
                    "回避冲突先赶进度",
                    "请第三方协助校准预期",
                ],
            ),
            4: (
                f"{target}：复盘答辩",
                _event_description(
                    target=target,
                    role=role,
                    goal=goal,
                    strength=strength,
                    challenge=challenge,
                    success=success,
                    stage_label="复盘答辩",
                    pressure="行动进入收束阶段，你要面对一次复盘答辩。评审不会只看结果，也会看你如何解释选择、代价和成长。",
                    conflict="有人希望你淡化问题，有人希望你把责任讲清楚。你的表达会决定别人如何评价你的成熟度。",
                    observer="评审老师",
                    previous_note=previous_note,
                ),
                "评审老师",
                "识别你是否真正形成成长能力",
                _opening_line(4, "评审老师", goal, challenge, success),
                [
                    "承认问题并给改进方案",
                    "用证据说明关键决策",
                    "感谢团队并交接方法",
                    "只强调最终成绩",
                    "说明下一次会如何重做",
                ],
            ),
        }

    title, desc, npc_role, npc_goal, opening_line, choices = arcs.get(stage, arcs[4])
    if rng.random() < 0.35:
        rng.shuffle(choices)

    return EpisodeEvent(
        id=f"evt_{stage}_{uuid4().hex[:6]}",
        stage=stage,
        title=title,
        description=desc,
        choices=choices,
        npc_role=npc_role,
        npc_goal=npc_goal,
        opening_line=opening_line,
    )


def _event_pool(simulation_type: Literal["growth", "job"], stage: int) -> list[tuple[str, str, list[str], str, str, str]]:
    if simulation_type == "growth":
        base = {
            1: [
                (
                    "加入社团招新",
                    "你刚加入学生组织，招新现场出现分工混乱。",
                    ["主动接管流程", "先观察再介入", "找老师协调"],
                    "组织负责人",
                    "快速稳定秩序并保证公平",
                    "现场很乱，你会先做哪一步？",
                ),
                (
                    "宿舍冲突升级",
                    "舍友因公共卫生问题争执，你被卷入。",
                    ["组织沟通会议", "私下逐个沟通", "回避冲突"],
                    "辅导员",
                    "降低冲突并建立规则",
                    "你愿意先提出一个可执行规则吗？",
                ),
            ],
            2: [
                (
                    "活动预算被砍",
                    "学院临时削减预算，活动执行受阻。",
                    ["缩小范围保核心", "拉外部赞助", "申请延期"],
                    "活动指导老师",
                    "在资源受限下保证活动目标",
                    "预算被砍了，你现在的优先级是什么？",
                ),
                (
                    "团队核心请假",
                    "核心同学考试周请假，进度风险上升。",
                    ["临时重排职责", "自己顶上关键任务", "降低目标"],
                    "项目同伴",
                    "保障进度并维持团队稳定",
                    "如果我本周请假，你会怎么调整排期？",
                ),
            ],
            3: [
                (
                    "舆情突发",
                    "活动海报引发争议，群里意见分裂。",
                    ["公开回应并修正", "内部先统一口径", "删除内容不回应"],
                    "宣传负责人",
                    "在争议中控制风险并维持信任",
                    "我们现在被质疑了，你主张怎么回应？",
                ),
                (
                    "规则与效率冲突",
                    "按流程审批会延误，但跳流程有风险。",
                    ["坚持流程并压缩节点", "先执行后补手续", "取消该环节"],
                    "学院行政老师",
                    "平衡合规与效率",
                    "你要效率还是合规，怎么兼顾？",
                ),
            ],
            4: [
                (
                    "复盘答辩",
                    "你需要在学院复盘会上说明得失与成长。",
                    ["承认问题并给方案", "强调成绩弱化问题", "把责任分散到团队"],
                    "评审老师",
                    "识别你是否具备成长型领导力",
                    "请你先说一个你最该改进的点。",
                ),
                (
                    "下一届交接",
                    "你要决定如何把经验传给下一届。",
                    ["建立文档和培训", "口头交接即可", "只交接关键人"],
                    "下一届负责人",
                    "评估你的传承意识",
                    "你会怎样让我少走弯路？",
                ),
            ],
        }
        return base.get(stage, base[4])

    base = {
        1: [
            (
                "简历初筛",
                "HR 质疑你的经历含金量。",
                ["量化成果回应", "强调学习潜力", "转移到态度"],
                "HR 面试官",
                "快速判断你是否值得进入下一轮",
                "请用 1 分钟证明你能胜任这个岗位。",
            ),
            (
                "自我介绍开局",
                "面试官要求 90 秒内说明你的岗位匹配度。",
                ["岗位需求对齐法", "从个人经历展开", "泛泛谈优点"],
                "业务面试官",
                "判断你的结构化表达能力",
                "你怎么把经历和岗位需求一一对应？",
            ),
        ],
        2: [
            (
                "业务追问",
                "面试官追问转化率下滑 20% 如何排查。",
                ["漏斗分层排查", "先做竞品对比", "先开会收集意见"],
                "业务面试官",
                "看你是否有业务诊断能力",
                "请先给我排查框架，再说第一步动作。",
            ),
            (
                "跨部门协作",
                "产品与运营目标冲突，需要你给方案。",
                ["定义共同指标", "先满足一方目标", "先推进再协调"],
                "团队主管",
                "判断你的协作与推进能力",
                "冲突很现实，你会先跟谁对齐？",
            ),
        ],
        3: [
            (
                "压力面",
                "主管连续否定你的方案。",
                ["澄清假设并迭代", "坚持原方案不让步", "情绪化反驳"],
                "团队主管",
                "测试你的抗压和反馈处理能力",
                "我现在否定你三次，你下一句怎么说？",
            ),
            (
                "案例即兴",
                "临时要求你设计一个拉新实验。",
                ["提出实验框架", "直接给结论", "请求跳过问题"],
                "业务面试官",
                "看你临场结构化能力",
                "没有准备时间，你怎么快速搭框架？",
            ),
        ],
        4: [
            (
                "终面价值观",
                "CEO 询问你为什么适合长期发展。",
                ["价值观与路径匹配", "强调薪资与平台", "只谈兴趣"],
                "CEO",
                "判断你是否适配长期团队文化",
                "为什么我们要把机会给你，而不是别人？",
            ),
            (
                "Offer 谈判",
                "你拿到 offer，如何确认最终选择。",
                ["评估成长与匹配", "只看短期薪资", "拖延不回复"],
                "HRBP",
                "判断你的职业成熟度",
                "你会用什么标准做最终决策？",
            ),
        ],
    }
    return base.get(stage, base[4])


def _generate_event_fallback(episode: SimulationEpisode, rng: random.Random) -> EpisodeEvent:
    if episode.target and len(episode.target.strip()) >= 4:
        return _goal_driven_event(episode, rng)

    pool = _event_pool(episode.simulation_type, episode.current_stage)
    title, desc, choices, npc_role, npc_goal, opening_line = rng.choice(pool)
    return EpisodeEvent(
        id=f"evt_{episode.current_stage}_{rng.randint(1000, 9999)}",
        stage=episode.current_stage,
        title=title,
        description=desc,
        choices=choices,
        npc_role=npc_role,
        npc_goal=npc_goal,
        opening_line=opening_line,
    )


def _generate_event_ai(episode: SimulationEpisode) -> tuple[EpisodeEvent | None, str | None]:
    history = [
        {
            "turn": t.turn,
            "choice": t.choice,
            "score": t.aggregate.overall_score,
            "narrative": t.narrative,
        }
        for t in episode.turns[-4:]
    ]

    system_prompt = """
你是剧情导演AI，负责为人才成长/求职模拟器生成下一回合事件。
要求：
1) 事件必须与用户目标相关，并受当前状态影响。
2) 保持真实职场/校园语境，避免空泛。
3) 输出 JSON，不要 markdown。
""".strip()

    user_prompt = f"""
请为第 {episode.current_stage} 阶段生成事件。

模拟器类型: {episode.simulation_type}
目标: {episode.target}
当前状态: {json.dumps(episode.state.model_dump(), ensure_ascii=False)}
最近历史: {json.dumps(history, ensure_ascii=False)}

输出 JSON:
{{
  "title": string,
  "description": string,
  "npc_role": string,
  "npc_goal": string,
  "opening_line": string,
  "choices": [string,string,string]
}}
""".strip()

    payload, err = llm_generate_json(system_prompt=system_prompt, user_prompt=user_prompt, temperature=0.8)
    if payload is None:
        return None, err

    try:
        choices = payload.get("choices") or []
        if not isinstance(choices, list) or len(choices) < 2:
            return None, "choices invalid"
        if len(choices) > 4:
            choices = choices[:4]

        event = EpisodeEvent(
            id=f"evt_{episode.current_stage}_{uuid4().hex[:6]}",
            stage=episode.current_stage,
            title=str(payload.get("title", "临时事件")),
            description=str(payload.get("description", "系统生成了一个新事件。")),
            choices=[str(c) for c in choices],
            npc_role=str(payload.get("npc_role", "场景角色")),
            npc_goal=str(payload.get("npc_goal", "推动剧情发展")),
            opening_line=str(payload.get("opening_line", "我们继续这个场景。")),
        )
        return event, None
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


def _generate_event(episode: SimulationEpisode, rng: random.Random) -> tuple[EpisodeEvent, str, str | None]:
    if should_try_real_llm():
        event, err = _generate_event_ai(episode)
        if event is not None:
            return event, "openai", None
        fallback = _generate_event_fallback(episode, rng)
        return fallback, "mock", err

    return _generate_event_fallback(episode, rng), "mock", "ai_provider not openai"


def _npc_reply_fallback(episode: SimulationEpisode, user_message: str) -> str:
    if not episode.current_event:
        return f"我听到了你的选择：{user_message}。请继续给出更具体的执行步骤。"

    event = episode.current_event
    target = _short_target(episode.target)
    pressure_hint = "压力还在上升" if episode.state.pressure >= 55 else "局面暂时还能控制"
    readiness_hint = "你的准备度已经被看见" if episode.state.readiness >= 65 else "对方仍在观察你是否真正准备好了"
    return (
        f"[{event.npc_role}] 你选择“{user_message}”，我会把它理解为你对“{target}”的当前判断。"
        f"但{pressure_hint}，{readiness_hint}。"
        f"如果继续推进，请说清楚你下一步要争取谁、放弃什么、用什么证据证明有效。"
    )


def _npc_reply_ai(episode: SimulationEpisode, user_message: str) -> tuple[str | None, str | None]:
    if not episode.current_event:
        return None, "no current event"

    system_prompt = f"""
你正在扮演剧情角色：{episode.current_event.npc_role}
角色目标：{episode.current_event.npc_goal}
你要与用户进行自然、有压迫感或引导感的对话。
输出简洁中文，不要使用 markdown。
""".strip()

    user_prompt = f"""
事件标题：{episode.current_event.title}
事件背景：{episode.current_event.description}
用户刚才回答：{user_message}
请你作为该角色继续追问或反馈（1-3句）。
""".strip()

    return llm_generate_text(system_prompt=system_prompt, user_prompt=user_prompt, temperature=0.7)


def _update_state(state: EpisodeState, score: float, rng: random.Random) -> EpisodeState:
    delta_conf = int((score - 60) / 6) + rng.randint(-2, 2)
    delta_readiness = int((score - 65) / 7) + rng.randint(-2, 2)
    delta_pressure = int((70 - score) / 6) + rng.randint(-1, 2)
    delta_energy = int((score - 70) / 8) + rng.randint(-3, 1)

    return EpisodeState(
        confidence=_clamp(state.confidence + delta_conf),
        readiness=_clamp(state.readiness + delta_readiness),
        pressure=_clamp(state.pressure + delta_pressure),
        energy=_clamp(state.energy + delta_energy),
    )


def _choice_consequence(event: EpisodeEvent, choice: str, score: float) -> str:
    key = choice.lower()
    title = event.title.lower()
    desc = event.description.lower()

    if "关系" in title or "靠近" in title or "期待" in title or "矛盾" in title or "对方" in desc:
        if any(word in key for word in ["了解", "近况", "感受", "复述", "不安", "边界", "期待"]):
            return (
                f"你没有急着把关系推向一个结论，而是先把对方的感受放到桌面上。"
                f"这让气氛从试探变得更真实，对方虽然还没有给出承诺，但开始愿意说明自己的顾虑。"
                f"你的主动权不是来自压迫，而是来自你能不能让这段对话保持安全。"
            )
        if any(word in key for word in ["表达", "认识", "约定", "愿意", "慢慢"]):
            return (
                f"你把自己的心意说得更清楚，也给对方留下了呼吸空间。"
                f"这一步没有立刻换来确定答案，但它降低了暧昧里的误会成本。"
                f"接下来，对方会观察你说的尊重是不是能持续体现在行动里。"
            )
        if any(word in key for word in ["冷淡", "测试", "逼问", "要求", "强烈承诺"]):
            return (
                f"你试图用更强的方式推动关系给出答案。"
                f"短时间内局面确实变得明确，但对方也感受到了压力，语气开始变得谨慎。"
                f"如果下一步不能把控制感降下来，这段关系会从靠近转向防御。"
            )
        if any(word in key for word in ["后退", "空间", "尊重", "停止", "不合适"]):
            return (
                f"你选择把节奏放慢，承认关系不是单方面推进就能成立。"
                f"这让现场的紧张感下降，也让对方重新看见你的边界感。"
                f"但后退不是消失，下一步你仍需要说明自己会如何体面地面对结果。"
            )
        return (
            f"你围绕“{choice}”做出了回应，关系的方向因此出现细微变化。"
            f"对方没有马上给出答案，但开始更认真地判断：你是在靠近一个真实的人，还是只是在追求一个结果。"
        )

    if any(mark in title for mark in ["：", ":"]):
        if any(word in key for word in ["目标", "分工", "拆解", "需求", "标准", "边界"]):
            return (
                f"你没有急着表演，而是先把目标拆开。"
                f"现场的注意力从混乱转向了几个可以被验证的判断点，{event.npc_role}开始追问你如何排序。"
                f"这让你获得了短暂的主动权，但也意味着下一步必须拿出更硬的证据。"
            )
        if any(word in key for word in ["主动", "接管", "推进", "硬推进", "承诺", "加班"]):
            return (
                f"你向前一步，把最烫手的部分接了下来。"
                f"团队短暂安静，因为有人终于愿意承担结果；但这份主动也把风险压到了你身上。"
                f"如果下一轮不能把行动拆细，信任会很快变成质疑。"
            )
        if any(word in key for word in ["资源", "外部", "争取", "求助", "团队", "沟通", "同步", "共创"]):
            return (
                f"你选择先重组关系和资源，而不是单点硬冲。"
                f"局面没有立刻变轻，但可用的支持开始浮出水面，{event.npc_role}也在观察你是否能让别人愿意跟上。"
                f"下一步，协作成本会成为真正的考题。"
            )
        if any(word in key for word in ["证据", "数据", "量化", "计划", "阶段", "风险", "验证"]):
            return (
                f"你把回答压到证据和计划上，空气里少了一些虚浮。"
                f"对方不再只听态度，而是开始沿着你的指标继续追问。"
                f"这是一条更稳的路，但每一个数字都可能成为下一轮压力点。"
            )
        if any(word in key for word in ["观察", "回避", "泛泛", "只强调", "学习能力"]):
            return (
                f"你选择先退后或保持笼统，暂时避开了正面冲突。"
                f"可是沉默和空泛也被记录了下来，{event.npc_role}的耐心明显变少。"
                f"下一轮你需要用更具体的动作把主动权拿回来。"
            )
        return (
            f"你围绕“{choice}”做出了选择，剧情开始向新的方向倾斜。"
            f"{event.npc_role}没有立刻否定你，但把问题压得更具体：这一步能否真的服务于“{event.npc_goal}”？"
            f"下一幕会检验你的判断是否经得起资源、时间和关系压力。"
        )

    if "宿舍冲突" in title or "宿舍" in desc or "争执" in desc:
        if any(word in key for word in ["介入", "调解", "组织", "沟通", "协调"]):
            return (
                f"你走上前，把两人的争执拆成了几个可以谈的点。"
                f"空气仍然沉重，然而这一次矛盾被你以一句明确的规则暂时按住。"
                f"在舍友和辅导员眼里，你成了那个“关键时刻敢说话”的人，接下来的几天，你需要用行动维护这份新生的信任。"
            )
        if any(word in key for word in ["观察", "回避", "袖手旁观", "暂不表态", "先看", "先听"]):
            return (
                f"你选择了退到一边，眼前的冲突继续发酵。"
                f"争吵最终演变成了肢体碰撞，双方都带着擦伤去了医院，走廊里弥漫着消毒水和尴尬。"
                f"后来你发现有人留意到你在场却没有插手，这种沉默让你心里生出一种说不出的不舒服。"
            )
        return (
            f"你让他们先冷静片刻，再等情绪沉降后再说。"
            f"这给了你时间思考，但也让一部分人心中留下了“关键时刻你并未挺身而出”的印象。"
        )

    if "活动预算" in title or "预算" in desc or "经费" in desc:
        if any(word in key for word in ["缩小", "保核心", "节省", "优先"]):
            return (
                f"你选择把资源收拢到最关键的那个点。"
                f"虽然有人不满项目规模缩减，但你让团队看到了一个还能推进的现实路径。"
                f"接下来你要用实际执行结果，去回应那些对这次取舍有疑虑的声音。"
            )
        if any(word in key for word in ["赞助", "申请", "外部", "拉外部", "求助"]):
            return (
                f"你把目光转向了院外的支援，开始敲开一扇又一扇门。"
                f"短时间内你为团队争取到了应急资金，大家松了一口气，但这笔资源也把你和这次结果紧紧绑在了一起。"
            )
        return (
            f"你先把问题交给老师和核心成员，自己先保持观察。"
            f"此刻现场看起来平静，但你也因此错过了一个让人记住你决断力的机会。"
        )

    if "团队核心请假" in title or "请假" in desc or "排期" in desc:
        if any(word in key for word in ["重排", "自己顶上", "承担", "调整"]):
            return (
                f"你果断地把空缺补了上去，把自己的节奏推到了前台。"
                f"虽然压力骤然提升，但项目没有停下来。队友开始重新评估你的可靠性，后续你要避免这次担当被当成今后无条件的默认答案。"
            )
        if any(word in key for word in ["回避", "观望", "拖延"]):
            return (
                f"你选择先观察，等待更多信息浮出水面。"
                f"然而时间在流逝，团队的眼神渐渐从期待转为隐隐的不安。"
            )
        return (
            f"你把任务拆成了几个阶段性目标，并先交出了一个可行方案。"
            f"这让大家看到了方向，但真正的信任要靠你后续把它一步步兑现。"
        )

    if "舆情突发" in title or "舆情" in desc or "争议" in desc:
        if any(word in key for word in ["公开回应", "修正", "澄清"]):
            return (
                f"你选择站出来发言，主动把指责转成了解决方案。"
                f"虽然舆论还在波动，但语气已经从责备变成了求解，这让一部分人重新审视你的处理方式。"
            )
        if any(word in key for word in ["统一", "内部", "不回应", "先不回应"]):
            return (
                f"你选择先收回声音，先把内部的事实梳理清楚再对外表态。"
                f"这给了你准备时间，但也让一部分外界解读为回避。"
            )
        return (
            f"你让这件事先沉下来，先收集更多信息再行动。"
            f"这样做暂时避免了更大波动，但也让人对你的果断性产生疑问。"
        )

    if "流程与效率" in title or "流程" in desc or "效率" in desc or "审批" in desc:
        if any(word in key for word in ["坚持流程", "流程", "合规", "审批"]):
            return (
                f"你把事情拉回了流程和规范的轨道，给现场带来了一阵秩序感。"
                f"有人因此觉得稳妥，但也有人开始抱怨节奏被拖慢。"
                f"你接下来要用时间节点证明，这种稳妥是真正的进步，而不是拖延。"
            )
        if any(word in key for word in ["先执行", "后补", "跳流程"]):
            return (
                f"你选择先行动再补手续，现场的气氛瞬间被按下了快进键。"
                f"这带来了短期推进，但同时也让合规风险像影子一样跟在你身后。"
            )
        return (
                f"你试图在规则和效率之间寻找折中。"
                f"这让人看出你在权衡，但真正的效果还要由后续是否能落地来评判。"
        )

    if "终面" in title or "价值观" in desc or "长期" in desc:
        if any(word in key for word in ["价值观", "长期", "平台", "事业"]):
            return (
                f"你把回答拉到成长与价值观上，把这一刻变成了一次信念展示。"
                f"对方会把你记住为有远见的人，但你后续仍需用具体案例去支撑这份远见。"
            )
        if any(word in key for word in ["薪资", "待遇", "条件", "回报"]):
            return (
                f"你把话题聚焦在现实回报上，让回合更像一次务实谈判。"
                f"这让对方觉得你脚踏实地，但也可能让你在团队契合上失去一丝柔软。"
            )
        return (
                f"你试图把价值观和现实条件融合成一个整体。"
                f"这种表达让你显得更立体，但也要避免给人犹豫不决的感觉。"
        )

    if "offer" in title or "谈判" in desc or "最终选择" in desc:
        if any(word in key for word in ["成长", "匹配", "导师", "发展"]):
            return (
                f"你把重点放在成长与匹配上，传达出你更看重长期发展。"
                f"这会让HR觉得你稳重，但你也要准备好解释你的现实支撑点。"
            )
        if any(word in key for word in ["薪资", "待遇", "拖延", "条件"]):
            return (
                f"你把谈判拉回到薪资条件，当前瞬间像是一场商务博弈。"
                f"这会让对方觉得你理性，但也可能让你在文化契合上失去一丝柔性。"
            )
        return (
                f"你在成长和现实间做了权衡，现场氛围变得更务实。"
                f"后续你需要用更具体的行动去支撑这次权衡。"
        )

    if any(word in key for word in ["定量", "数据", "框架", "排查", "诊断", "分析"]):
        return (
            f"你用一个清晰的逻辑框架回应，将对话从感性拉回到理性。"
            f"现场气氛开始向“可验证”“可落地”的方向移动。"
        )

    if any(word in key for word in ["主动", "负责", "承担", "接手", "推动"]):
        return (
            f"你选择主动出手，把这次结果和你自己的名字绑在了一起。"
            f"这让你获得了更高的发言权，也让后续的责任更加清晰。"
        )

    if any(word in key for word in ["回避", "袖手旁观", "观望", "暂不"]):
        return (
            f"你选择了退后一步，避免了直接卷入。"
            f"这样的沉默在旁人眼里，会慢慢被解读成一种难以言说的犹豫。"
        )

    return (
        f"你本轮选择了“{choice}”，故事从这里继续展开。"
        f"这次决定已经在场面上留下一道痕迹，后续的关系和信任也将因此被重新审视。"
    )


def _scene_atmosphere(stage: int, event: EpisodeEvent, state: EpisodeState) -> str:
    if any(word in event.title for word in ["靠近", "期待", "矛盾", "关系"]):
        pressure = "气氛有些微妙，对方的沉默比直接拒绝更难判断" if state.pressure >= 55 else "气氛还算平稳，但每一句话都可能改变距离感"
        energy = "你还能保持耐心，愿意听见对方真实的顾虑" if state.energy >= 60 else "你有些疲惫，容易把不确定误读成否定"
        return (
            f"第 {stage} 阶段的关系场景继续展开。{event.description}"
            f"{pressure}。{energy}。"
        )

    pressure = "空气明显绷紧，几个人的目光在你和负责人之间来回移动" if state.pressure >= 55 else "现场暂时安静下来，但每个人都在等一个更明确的方向"
    energy = "你的精力还撑得住，能继续把复杂问题拆开" if state.energy >= 60 else "连续判断已经消耗了不少精力，你开始需要更谨慎地分配注意力"
    return (
        f"第 {stage} 阶段的场景继续展开。{event.description}"
        f"{pressure}。{energy}。"
    )


def _stake_line(event: EpisodeEvent, choice: str, state: EpisodeState) -> str:
    if state.readiness >= 70:
        readiness = "你的准备度让对方愿意继续听你把方案讲完"
    elif state.readiness >= 50:
        readiness = "你的准备度还不足以彻底说服所有人，但已经能支撑一次尝试"
    else:
        readiness = "你的准备度还显得摇摆，对方会更严厉地检查每一个细节"

    if any(word in event.title for word in ["靠近", "期待", "矛盾", "关系"]):
        return (
            f"这一次选择的真正赌注，不只是“{choice}”能不能让对方心动，"
            f"而是你能否在期待、尊重和边界之间保持清醒。{readiness}。"
        )

    return (
        f"这一次选择的真正赌注，不只是“{choice}”本身是否正确，"
        f"而是它能否服务于“{event.npc_goal}”。{readiness}。"
    )


def _npc_reaction_line(event: EpisodeEvent, choice: str, score: float) -> str:
    if any(word in event.title for word in ["靠近", "期待", "矛盾", "关系"]):
        if score >= 85:
            reaction = "神情放松了一些，愿意把自己的真实顾虑说得更具体"
        elif score >= 70:
            reaction = "没有立刻靠近，但也没有退开，而是在认真分辨你的表达是否稳定"
        else:
            reaction = "明显变得谨慎，开始担心你只是想快速得到一个答案"
        return (
            f"{event.npc_role}听完你的选择后，{reaction}。"
            f"关系里的分数不是胜负，而是你是否同时看见自己和对方。"
        )

    if score >= 85:
        reaction = "语气缓和下来，甚至开始主动补充资源和信息"
    elif score >= 70:
        reaction = "没有完全放松，但已经把质疑从“你行不行”转向“这件事怎么落地”"
    else:
        reaction = "眉头皱得更紧，问题被推回到你面前"

    return (
        f"{event.npc_role}听完你的选择后，{reaction}。"
        f"他没有只看表态，而是在判断你是否看见了目标背后的代价。"
    )


def _next_hook(stage: int, state: EpisodeState) -> str:
    if stage >= 4:
        return "这一轮之后，剧情进入结算。系统会把你的连续选择、承压表现和目标推进程度合并成最终结局。"

    if state.pressure >= 60:
        return "下一幕里，压力不会消失。相反，它会换一种形式回来：可能是资源被压缩、关键人物反对，或者评审要求你立刻拿出证据。"
    if state.confidence >= 70:
        return "下一幕里，你会拥有更多主动权，但主动权也会带来更高期待。别人会开始默认你能处理更复杂的局面。"
    return "下一幕里，局势还没有完全倒向你。你需要用更具体的行动，把刚刚建立起来的一点信任稳住。"


def _narrative(stage: int, event: EpisodeEvent, score: float, state: EpisodeState, choice: str | None = None) -> str:
    if score >= 85:
        tone = "这一回合你的判断与行动都赢得了较高认可。"
    elif score >= 70:
        tone = "你已经把握住了大方向，但细节处还有提升空间。"
    else:
        tone = "当前回合的选择还未完全命中对方期望，后续要迅速调整你的节奏。"

    choice_line = f"你选择了「{choice}」，" if choice else "本轮行动触发了接下来的剧情发展，"
    consequence_line = _choice_consequence(event, choice or "", score)
    context_line = f"本事件围绕“{event.npc_goal}”展开，{event.npc_role}的反应将决定你是继续掌控场面，还是被动接收局势。"
    score_line = f"本轮系统评估为 {round(score)} 分。{tone}"
    state_line = f"当前状态：信心 {state.confidence}，压力 {state.pressure}，精力 {state.energy}，准备度 {state.readiness}。"
    paragraphs = [
        _scene_atmosphere(stage, event, state),
        f"{choice_line}{_stake_line(event, choice or '继续推进', state)}",
        consequence_line,
        _npc_reaction_line(event, choice or "继续推进", score),
        context_line,
        _next_hook(stage, state),
        f"{score_line}{state_line}",
    ]

    return "\n\n".join(paragraphs)


def _build_ending(episode: SimulationEpisode) -> EpisodeEnding:
    avg_score = 0.0
    if episode.turns:
        avg_score = sum(turn.aggregate.overall_score for turn in episode.turns) / len(episode.turns)

    s = episode.state
    target = _short_target(episode.target)
    if episode.simulation_type == "job":
        if avg_score >= 82 and s.readiness >= 80:
            return EpisodeEnding(
                code="JOB_OFFER_STRONG",
                title="高匹配 Offer 结局",
                summary=f"围绕“{target}”，你在关键回合中保持稳定输出，最终获得高匹配度岗位机会。",
                next_steps=["优先谈判成长空间和导师机制", "入职前补齐业务指标体系", "制定前30天行动计划"],
            )
        if avg_score >= 70:
            return EpisodeEnding(
                code="JOB_OFFER_BORDERLINE",
                title="可争取 Offer 结局",
                summary=f"围绕“{target}”，你通过了主要关卡，但在压力面和深度案例上仍有提升空间。",
                next_steps=["针对压力追问做专项训练", "补2个高质量业务案例", "优化STAR表达模板"],
            )
        return EpisodeEnding(
            code="JOB_REJECT_GROWTH",
            title="暂未通过结局",
            summary=f"围绕“{target}”，当前能力结构尚未覆盖目标岗位要求，但已明确主要短板。",
            next_steps=["先冲刺沟通和逻辑能力", "以实习/项目补齐经验", "4周后重新进入模拟挑战"],
        )

    if avg_score >= 82 and s.confidence >= 75 and s.pressure <= 55:
        return EpisodeEnding(
            code="GROWTH_LEADER",
            title="成长领航者结局",
            summary=f"围绕“{target}”，你在冲突、协作与复盘中持续做出高质量决策，具备带队潜力。",
            next_steps=["承担更高复杂度组织任务", "建立团队复盘机制", "沉淀方法论并做经验传承"],
        )
    if avg_score >= 70:
        return EpisodeEnding(
            code="GROWTH_STEADY",
            title="稳步成长结局",
            summary=f"围绕“{target}”，你具备稳定的责任与执行能力，正在形成个人成长节奏。",
            next_steps=["加强高压沟通训练", "提升复杂协作中的协调能力", "固定每周复盘输出"],
        )
    return EpisodeEnding(
        code="GROWTH_REBUILD",
        title="重塑提升结局",
        summary=f"围绕“{target}”，你已识别关键短板，下一阶段重点是建立稳定行为模式。",
        next_steps=["先从单点任务建立成功经验", "引入同伴反馈机制", "按周追踪压力与执行指标"],
    )


def _persist_episode(episode: SimulationEpisode) -> None:
    conninfo = get_psycopg_conninfo()
    if not conninfo:
        return

    try:
        with psycopg.connect(conninfo) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS app_simulation_episodes (
                        episode_id TEXT PRIMARY KEY,
                        student_id TEXT NOT NULL,
                        simulation_type TEXT NOT NULL,
                        target TEXT NOT NULL,
                        total_stages INT NOT NULL,
                        current_stage INT NOT NULL,
                        status TEXT NOT NULL,
                        state_json JSONB NOT NULL,
                        current_event_json JSONB,
                        ending_json JSONB,
                        dialogue_json JSONB,
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS app_simulation_episode_turns (
                        id BIGSERIAL PRIMARY KEY,
                        episode_id TEXT NOT NULL,
                        turn_index INT NOT NULL,
                        choice_text TEXT NOT NULL,
                        aggregate_json JSONB NOT NULL,
                        state_after_json JSONB NOT NULL,
                        narrative TEXT NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )

                cur.execute(
                    """
                    INSERT INTO app_simulation_episodes (
                      episode_id, student_id, simulation_type, target, total_stages,
                      current_stage, status, state_json, current_event_json, ending_json, dialogue_json, updated_at
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
                    ON CONFLICT (episode_id) DO UPDATE SET
                      current_stage = EXCLUDED.current_stage,
                      status = EXCLUDED.status,
                      state_json = EXCLUDED.state_json,
                      current_event_json = EXCLUDED.current_event_json,
                      ending_json = EXCLUDED.ending_json,
                      dialogue_json = EXCLUDED.dialogue_json,
                      updated_at = NOW()
                    """,
                    (
                        episode.episode_id,
                        episode.student_id,
                        episode.simulation_type,
                        episode.target,
                        episode.total_stages,
                        episode.current_stage,
                        episode.status,
                        json.dumps(episode.state.model_dump(), ensure_ascii=False),
                        json.dumps(episode.current_event.model_dump(), ensure_ascii=False) if episode.current_event else None,
                        json.dumps(episode.ending.model_dump(), ensure_ascii=False) if episode.ending else None,
                        json.dumps([d.model_dump() for d in episode.dialogue], ensure_ascii=False),
                    ),
                )

                cur.execute("DELETE FROM app_simulation_episode_turns WHERE episode_id = %s", (episode.episode_id,))
                for i, turn in enumerate(episode.turns, start=1):
                    cur.execute(
                        """
                        INSERT INTO app_simulation_episode_turns (
                          episode_id, turn_index, choice_text, aggregate_json, state_after_json, narrative
                        ) VALUES (%s,%s,%s,%s,%s,%s)
                        """,
                        (
                            episode.episode_id,
                            i,
                            turn.choice,
                            json.dumps(turn.aggregate.model_dump(), ensure_ascii=False),
                            json.dumps(turn.state_after.model_dump(), ensure_ascii=False),
                            turn.narrative,
                        ),
                    )
            conn.commit()
    except Exception:
        pass


def start_episode(request: EpisodeStartRequest) -> SimulationEpisode:
    rng = random.Random(request.seed if request.seed is not None else int(datetime.utcnow().timestamp()))
    episode = SimulationEpisode(
        episode_id=f"ep_{request.simulation_type}_{uuid4().hex[:8]}",
        student_id=request.student_id,
        simulation_type=request.simulation_type,
        target=request.target,
        total_stages=4,
        current_stage=1,
        status="running",
        state=EpisodeState(confidence=55, pressure=45, energy=70, readiness=50),
        current_event=None,
        dialogue=[],
        turns=[],
        ending=None,
    )

    event, _, _ = _generate_event(episode, rng)
    episode.current_event = event
    episode.dialogue = [EpisodeDialogueMessage(speaker="npc", content=event.opening_line, timestamp=_now_iso())]

    EPISODE_STORE[episode.episode_id] = episode
    _persist_episode(episode)
    return episode


def get_episode(episode_id: str) -> SimulationEpisode | None:
    return EPISODE_STORE.get(episode_id)


def talk_episode(episode_id: str, request: EpisodeDialogueRequest) -> EpisodeDialogueResponse | None:
    episode = EPISODE_STORE.get(episode_id)
    if not episode or episode.status == "completed" or not episode.current_event:
        return None

    episode.dialogue.append(EpisodeDialogueMessage(speaker="user", content=request.message, timestamp=_now_iso()))

    engine = "mock"
    fallback_reason: str | None = None
    reply_text: str

    if should_try_real_llm():
        reply, err = _npc_reply_ai(episode, request.message)
        if reply:
            reply_text = reply
            engine = "openai"
        else:
            reply_text = _npc_reply_fallback(episode, request.message)
            fallback_reason = err
    else:
        reply_text = _npc_reply_fallback(episode, request.message)
        fallback_reason = "ai_provider not openai"

    if fallback_reason:
        reply_text = f"{reply_text}（回退原因：{fallback_reason}）"

    episode.dialogue.append(EpisodeDialogueMessage(speaker="npc", content=reply_text, timestamp=_now_iso()))
    EPISODE_STORE[episode_id] = episode
    _persist_episode(episode)

    return EpisodeDialogueResponse(
        episode_id=episode.episode_id,
        npc_role=episode.current_event.npc_role,
        reply=reply_text,
        dialogue=episode.dialogue,
    )


def act_episode(episode_id: str, request: EpisodeActionRequest) -> EpisodeActionResponse | None:
    episode = EPISODE_STORE.get(episode_id)
    if not episode or episode.status == "completed" or episode.current_event is None:
        return None

    choice_text = (request.user_response or request.choice or "").strip()
    if not choice_text:
        return None

    rng = random.Random(hash((episode_id, len(episode.turns), choice_text)) & 0xFFFFFFFF)

    episode.dialogue.append(EpisodeDialogueMessage(speaker="user", content=choice_text, timestamp=_now_iso()))

    npc_reply = _npc_reply_fallback(episode, choice_text)
    npc_fallback_reason: str | None = None
    if should_try_real_llm():
        text, err = _npc_reply_ai(episode, choice_text)
        if text:
            npc_reply = text
        else:
            npc_fallback_reason = err
    else:
        npc_fallback_reason = "ai_provider not openai"

    episode.dialogue.append(EpisodeDialogueMessage(speaker="npc", content=npc_reply, timestamp=_now_iso()))

    run_request = SimulationStartRequest(
        student_id=episode.student_id,
        simulation_type=episode.simulation_type,
        scene=f"{episode.current_event.title} | {episode.current_event.description}",
        target_job=episode.target if episode.simulation_type == "job" else None,
        messages=[SimulationMessage(role="user", content=choice_text)],
    )

    aggregate, engine, fallback_reason = run_simulation_and_persist(run_request)
    if npc_fallback_reason and not fallback_reason:
        fallback_reason = f"npc:{npc_fallback_reason}"

    next_state = _update_state(episode.state, aggregate.overall_score, rng)
    narrative = _narrative(
        episode.current_stage,
        episode.current_event,
        aggregate.overall_score,
        next_state,
        choice_text,
    )

    turn = EpisodeTurnResult(
        turn=len(episode.turns) + 1,
        choice=choice_text,
        aggregate=aggregate,
        state_after=next_state,
        narrative=narrative,
        engine=engine,
        fallback_reason=fallback_reason,
    )
    episode.turns.append(turn)
    episode.state = next_state

    if episode.current_stage >= episode.total_stages:
        episode.status = "completed"
        episode.current_event = None
        episode.ending = _build_ending(episode)
        finished = True
    else:
        episode.current_stage += 1
        next_event, _, event_fallback = _generate_event(episode, rng)
        episode.current_event = next_event
        episode.dialogue = [EpisodeDialogueMessage(speaker="npc", content=next_event.opening_line, timestamp=_now_iso())]
        if event_fallback:
            episode.dialogue.append(
                EpisodeDialogueMessage(
                    speaker="npc",
                    content=f"（事件生成回退：{event_fallback}）",
                    timestamp=_now_iso(),
                )
            )
        finished = False

    EPISODE_STORE[episode_id] = episode
    _persist_episode(episode)
    return EpisodeActionResponse(episode=episode, finished=finished)
