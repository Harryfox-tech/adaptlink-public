from fastapi import APIRouter, Query, HTTPException

from app.schemas.demand import (
    DemandPublishRequest,
    DemandPublishResponse,
    DemandDetailResponse,
    DemandIntentionRequest,
    DemandIntentionResponse,
    ParticipationCreateRequest,
    ParticipationCreateResponse,
    StudentParticipationsResponse,
)
from app.services import demand_service as demand_svc
from app.services import participation_service as participation_svc

router = APIRouter()


# ── Demands ─────────────────────────────────────────────────────────────────

@router.get("", response_model=dict)
def list_demands(
    domain: str | None = Query(default=None),
    cooperation_mode: str | None = Query(default=None),
    budget_range: str | None = Query(default=None),
    search: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
):
    """
    GET /demands
    Query params mirror frontend DemandFilterBar state.
    Returns {demands: [...], total: N}
    """
    demands = demand_svc.list_demands(
        domain=domain,
        cooperation_mode=cooperation_mode,
        budget_range=budget_range,
        search=search,
        keyword=keyword,
    )
    return {"demands": demands, "total": len(demands)}


@router.get("/stats", response_model=dict)
def demand_stats():
    return demand_svc.get_demand_stats()


@router.post("", response_model=DemandPublishResponse)
def publish_demand(payload: DemandPublishRequest):
    """
    POST /demands  — 企业发布技术需求
    creatorId / creatorRole 由调用方（auth proxy）注入，或通过 get_current_user() 取得。
    这里做简化：前端应已在 payload 中包含这两个字段。
    """
    data = payload.model_dump()
    # 如果前端未传 creatorId/creatorRole，从 Query 参数兜底
    demand = demand_svc.create_demand(data)
    return DemandPublishResponse(
        demand_id=demand["id"],
        title=demand["title"],
        saved=True,
        created_at=demand["createdAt"],
    )


@router.get("/{demand_id}", response_model=DemandDetailResponse)
def demand_detail(demand_id: str):
    demand = demand_svc.get_demand(demand_id)
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
    return DemandDetailResponse(
        demand=demand,
        match_count=demand.get("matchCount", 0),
    )


# ── Intentions ───────────────────────────────────────────────────────────────

# 注意：DemandIntention 目前仍在 in-memory（与 demands 同一 store），
# 后续接入 DB 后拆到独立表。

_intentions_store: dict = {}


@router.post("/intentions", response_model=DemandIntentionResponse)
def create_intention(payload: DemandIntentionRequest):
    import uuid
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    intention = {
        "id": f"int-{uuid.uuid4().hex[:8]}",
        "demandId": payload.demandId,
        "applicantId": payload.applicantId,
        "applicantRole": payload.applicantRole,
        "status": "pending",
        "message": payload.message,
        "abilities": payload.abilities,
        "createdAt": now,
        "updatedAt": now,
    }
    _intentions_store[intention["id"]] = intention
    return DemandIntentionResponse(
        intention_id=intention["id"],
        demand_id=intention["demandId"],
        saved=True,
        created_at=intention["createdAt"],
    )


# ── Participations ──────────────────────────────────────────────────────────

@router.get("/participations/student/{student_id}", response_model=StudentParticipationsResponse)
def student_participations(student_id: str):
    parts = participation_svc.list_participations(student_id=student_id)
    return StudentParticipationsResponse(participations=parts, total=len(parts))


@router.post("/participations", response_model=ParticipationCreateResponse)
def create_participation(payload: ParticipationCreateRequest):
    part = participation_svc.create_participation(payload.model_dump())
    return ParticipationCreateResponse(
        participation_id=part["id"],
        saved=True,
        created_at=part["createdAt"],
    )


@router.put("/participations/{participation_id}/status", response_model=dict)
def update_participation_status(participation_id: str, status: str = Query(...)):
    part = participation_svc.update_participation_status(participation_id, status)
    if not part:
        raise HTTPException(status_code=404, detail="Participation not found")
    return {"participation_id": part["id"], "status": part["status"], "updated": part["updatedAt"]}
