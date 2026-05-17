"""
成果库 in-memory store（P0 阶段，Prisma 迁移后替换为 DB 调用）
"""
import uuid
from datetime import datetime, timezone

# ── 存储 ────────────────────────────────────────────────────────────
_achievements_store: dict[str, dict] = {}

# ── 预置 Demo 数据 ───────────────────────────────────────────────────
_DEMO: list[dict] = [
    {
        "id": "ach-1",
        "creatorId": "school-1",
        "creatorRole": "school",
        "title": "高效钙钛矿太阳能电池低成本制备技术",
        "abstract": "团队研发的新型印刷工艺可将钙钛矿电池制备成本降低 60%，组件效率突破 24.3%，已获 3 项发明专利。本技术解决了传统钙钛矿电池制备工艺复杂、成本高昂的核心瓶颈，适用于分布式光伏、建筑一体化光伏等场景。",
        "achievementType": "专利",
        "domain": "新能源",
        "keywords": ["钙钛矿", "太阳能电池", "印刷工艺", "低成本制备"],
        "applicationScenario": "分布式光伏、建筑一体化光伏（BIPV）、便携式储能设备",
        "ipStatus": "已授权",
        "patentNumbers": ["CN202310001234.5", "CN202310005678.9", "CN202310009012.3"],
        "patentType": "发明专利",
        "publicationLink": "https://doi.org/10.1038/s41560-024-01234-5",
        "trlLevel": 6,
        "maturityDesc": "已完成工程样机验证，中试线建设中",
        "cooperationMode": "技术转让",
        "budgetRange": "50-200万",
        "transformationStage": "negotiating",
        "teamName": "新能源材料与器件研究团队",
        "institutionName": "清华大学材料学院",
        "contactName": "李明华 教授",
        "contactEmail": "liminghua@university.edu.cn",
        "contactPhone": "+86-138-0000-1234",
        "requiredAbilities": ["材料科学", "光电化学", "工艺工程", "光伏系统集成"],
        "status": "active",
        "viewCount": 128,
        "createdAt": "2026-03-15T08:00:00Z",
        "updatedAt": "2026-03-15T08:00:00Z",
    },
    {
        "id": "ach-2",
        "creatorId": "school-2",
        "creatorRole": "school",
        "title": "基于类器官芯片的个性化药物筛选平台",
        "abstract": "整合微流控芯片与 AI 图像分析，实现肿瘤患者类器官的快速培养与药物敏感性高通量筛选，为临床精准用药提供决策支持。平台已完成 200+ 例患者样本验证，筛选准确率达 87.3%。",
        "achievementType": "技术原型",
        "domain": "生物医药",
        "keywords": ["类器官", "微流控芯片", "药物筛选", "精准医疗", "AI图像分析"],
        "applicationScenario": "肿瘤精准用药、新药研发、个性化治疗方案制定",
        "ipStatus": "申请中",
        "patentNumbers": ["CN202410012345.6"],
        "patentType": "发明专利",
        "publicationLink": None,
        "trlLevel": 4,
        "maturityDesc": "原理样机已验证，正在进行临床前研究",
        "cooperationMode": "作价入股",
        "budgetRange": "200万+",
        "transformationStage": "published",
        "teamName": "生物微系统与精准医疗实验室",
        "institutionName": "北京大学医学部",
        "contactName": "张晓燕 副教授",
        "contactEmail": "zhangxy@biomed.edu.cn",
        "contactPhone": None,
        "requiredAbilities": ["微流控技术", "AI图像分析", "肿瘤学", "生物信息学"],
        "status": "active",
        "viewCount": 95,
        "createdAt": "2026-03-20T14:00:00Z",
        "updatedAt": "2026-03-20T14:00:00Z",
    },
    {
        "id": "ach-3",
        "creatorId": "school-3",
        "creatorRole": "school",
        "title": "工业级全光纤随机激光器关键技术",
        "abstract": "实现了 1.5μm 波段高功率低噪声全光纤随机激光输出，功率稳定性 < 0.5%，可用于相干通信、传感与工业加工。相比传统激光器，体积缩小 70%，成本降低 45%。",
        "achievementType": "专利",
        "domain": "电子信息",
        "keywords": ["随机激光", "全光纤", "相干通信", "工业激光"],
        "applicationScenario": "光纤传感、相干激光雷达、工业精密加工",
        "ipStatus": "已授权",
        "patentNumbers": ["CN202210034567.8", "CN202210078901.2"],
        "patentType": "发明专利",
        "publicationLink": "https://doi.org/10.1364/OL.456789",
        "trlLevel": 5,
        "maturityDesc": "实验室样机完成，正在进行工程化设计",
        "cooperationMode": "许可生产",
        "budgetRange": "10-50万",
        "transformationStage": "published",
        "teamName": "光子技术与应用研究所",
        "institutionName": "华中科技大学光学与电子信息学院",
        "contactName": "赵志远 副研究员",
        "contactEmail": "zhaozy@optech.edu.cn",
        "contactPhone": None,
        "requiredAbilities": ["光纤光学", "激光物理", "光电子封装"],
        "status": "active",
        "viewCount": 67,
        "createdAt": "2026-03-22T09:00:00Z",
        "updatedAt": "2026-03-22T09:00:00Z",
    },
    {
        "id": "ach-4",
        "creatorId": "school-4",
        "creatorRole": "school",
        "title": "农业废弃物高效降解产氢联产有机肥系统",
        "abstract": "开发基于嗜热菌群的秸秆类农业废弃物协同降解产氢工艺，同步产出高肥力有机肥，适合农村分布式能源站建设。系统产氢效率较传统工艺提升 3.2 倍，有机肥氮磷钾含量提升 28%。",
        "achievementType": "工艺方法",
        "domain": "节能环保",
        "keywords": ["生物产氢", "农业废弃物", "嗜热菌", "有机肥", "分布式能源"],
        "applicationScenario": "农村分布式能源站、秸秆综合利用、有机农业",
        "ipStatus": "已授权",
        "patentNumbers": ["CN202310056789.0"],
        "patentType": "发明专利",
        "publicationLink": None,
        "trlLevel": 6,
        "maturityDesc": "工程样机已完成，正在寻求中试合作",
        "cooperationMode": "技术转让",
        "budgetRange": "10-50万",
        "transformationStage": "published",
        "teamName": "农业生物能源工程团队",
        "institutionName": "中国农业大学工学院",
        "contactName": "孙立群 教授",
        "contactEmail": "sunlq@agrieng.edu.cn",
        "contactPhone": None,
        "requiredAbilities": ["生物工程", "发酵工程", "农村能源"],
        "status": "active",
        "viewCount": 43,
        "createdAt": "2026-03-28T15:00:00Z",
        "updatedAt": "2026-03-28T15:00:00Z",
    },
    {
        "id": "ach-5",
        "creatorId": "school-5",
        "creatorRole": "school",
        "title": "面向工业互联网的轻量化联邦学习框架",
        "abstract": "针对工业场景数据孤岛问题，设计了支持异构设备的轻量化联邦学习框架，通信开销降低 82%，模型精度损失 < 1.5%。已在 3 家制造企业完成部署验证，支持 OPC-UA 标准接入。",
        "achievementType": "软件著作权",
        "domain": "人工智能",
        "keywords": ["联邦学习", "工业互联网", "数据隐私", "边缘计算", "OPC-UA"],
        "applicationScenario": "工业质检、预测性维护、供应链协同优化",
        "ipStatus": "软件著作权",
        "patentNumbers": [],
        "patentType": None,
        "publicationLink": "https://arxiv.org/abs/2403.12345",
        "trlLevel": 7,
        "maturityDesc": "已在真实工业环境完成部署验证",
        "cooperationMode": "联合开发",
        "budgetRange": "50-200万",
        "transformationStage": "contracted",
        "teamName": "智能系统与工业互联网实验室",
        "institutionName": "上海交通大学电子信息与电气工程学院",
        "contactName": "陈浩然 研究员",
        "contactEmail": "chenhr@sjtu.edu.cn",
        "contactPhone": "+86-021-3420-5678",
        "requiredAbilities": ["深度学习", "联邦学习", "工业自动化", "边缘计算"],
        "status": "active",
        "viewCount": 156,
        "createdAt": "2026-04-01T10:00:00Z",
        "updatedAt": "2026-04-01T10:00:00Z",
    },
    {
        "id": "ach-6",
        "creatorId": "school-6",
        "creatorRole": "school",
        "title": "高强度可降解镁合金骨科植入材料",
        "abstract": "通过微合金化与表面改性技术，开发出力学性能匹配皮质骨、体内降解速率可调控的新型镁合金植入材料。动物实验显示 12 周内完全降解，无需二次手术取出，已获 FDA 预申请受理。",
        "achievementType": "专利",
        "domain": "生物医药",
        "keywords": ["镁合金", "可降解植入物", "骨科", "生物材料", "微合金化"],
        "applicationScenario": "骨折内固定、脊柱融合、关节修复",
        "ipStatus": "已授权",
        "patentNumbers": ["CN202210089012.4", "US17/456789"],
        "patentType": "发明专利",
        "publicationLink": "https://doi.org/10.1016/j.biomaterials.2024.122345",
        "trlLevel": 5,
        "maturityDesc": "动物实验完成，正在推进临床试验申请",
        "cooperationMode": "作价入股",
        "budgetRange": "200万+",
        "transformationStage": "negotiating",
        "teamName": "生物医用材料与植入器械研究中心",
        "institutionName": "西安交通大学生命科学与技术学院",
        "contactName": "王芳 教授",
        "contactEmail": "wangfang@xjtu.edu.cn",
        "contactPhone": "+86-029-8266-3456",
        "requiredAbilities": ["材料科学", "生物相容性测试", "骨科临床", "医疗器械注册"],
        "status": "active",
        "viewCount": 89,
        "createdAt": "2026-04-05T09:00:00Z",
        "updatedAt": "2026-04-05T09:00:00Z",
    },
]

# 初始化 demo 数据
for _item in _DEMO:
    _achievements_store[_item["id"]] = _item


# ── 查询 ─────────────────────────────────────────────────────────────

def list_achievements(
    achievement_type: str | None = None,
    domain: str | None = None,
    ip_status: str | None = None,
    trl_min: int | None = None,
    trl_max: int | None = None,
    status: str = "active",
) -> list[dict]:
    results = list(_achievements_store.values())
    if status:
        results = [r for r in results if r["status"] == status]
    if achievement_type:
        results = [r for r in results if r["achievementType"] == achievement_type]
    if domain:
        results = [r for r in results if r["domain"] == domain]
    if ip_status:
        results = [r for r in results if r["ipStatus"] == ip_status]
    if trl_min is not None:
        results = [r for r in results if r.get("trlLevel") is not None and r["trlLevel"] >= trl_min]
    if trl_max is not None:
        results = [r for r in results if r.get("trlLevel") is not None and r["trlLevel"] <= trl_max]
    return sorted(results, key=lambda x: x["createdAt"], reverse=True)


def get_achievement(achievement_id: str) -> dict | None:
    item = _achievements_store.get(achievement_id)
    if item:
        item["viewCount"] = item.get("viewCount", 0) + 1
    return item


def create_achievement(payload: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    item = {
        **payload,
        "id": f"ach-{uuid.uuid4().hex[:8]}",
        "status": "active",
        "viewCount": 0,
        "transformationStage": payload.get("transformationStage", "published"),
        "createdAt": now,
        "updatedAt": now,
    }
    _achievements_store[item["id"]] = item
    return item


def update_achievement_stage(achievement_id: str, stage: str) -> dict | None:
    item = _achievements_store.get(achievement_id)
    if not item:
        return None
    item["transformationStage"] = stage
    item["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return item


def get_achievement_stats() -> dict:
    items = [v for v in _achievements_store.values() if v["status"] == "active"]

    def _count_by(key: str) -> list[dict]:
        counts: dict[str, int] = {}
        for it in items:
            val = it.get(key)
            if val is not None:
                counts[str(val)] = counts.get(str(val), 0) + 1
        return [{"label": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]

    trl_counts: dict[int, int] = {}
    for it in items:
        trl = it.get("trlLevel")
        if trl is not None:
            trl_counts[trl] = trl_counts.get(trl, 0) + 1

    return {
        "total": len(items),
        "by_type": _count_by("achievementType"),
        "by_domain": _count_by("domain"),
        "by_trl": [{"trl": k, "count": v} for k, v in sorted(trl_counts.items())],
        "by_stage": _count_by("transformationStage"),
        "by_ip_status": _count_by("ipStatus"),
    }
