from fastapi import APIRouter, Query

from app.schemas.transformation import (
    TransformationApplyRequest,
    TransformationApplyResponse,
    TransformationApplicationItem,
    TransformationApplicationsResponse,
    TransformationDashboardResponse,
    TransformationProjectDetailResponse,
    TransformationProjectItem,
    TransformationProjectsResponse,
    TransformationPublishRequest,
    TransformationPublishResponse,
    TransformationStatsResponse,
)
from app.services import transformation_service as svc

router = APIRouter()


@router.get("/stats", response_model=TransformationStatsResponse)
def transformation_stats():
    return svc.get_transformation_stats()


@router.get("/projects", response_model=TransformationProjectsResponse)
def transformation_projects(
    creator_role: str | None = Query(default=None),
    project_type: str | None = Query(default=None),
    status: str | None = Query(default=None),
    domain: str | None = Query(default=None),
):
    projects = svc.list_transformation_projects(
        creator_role=creator_role,
        project_type=project_type,
        status=status,
        domain=domain,
    )
    items = [TransformationProjectItem(**p) for p in projects]
    return TransformationProjectsResponse(projects=items, total=len(items))


@router.post("/projects", response_model=TransformationPublishResponse)
def transformation_publish(payload: TransformationPublishRequest):
    project = svc.create_transformation_project(payload.model_dump())
    return TransformationPublishResponse(
        project_id=project["id"],
        title=project["title"],
        saved=True,
        created_at=project["createdAt"],
    )


@router.get("/projects/{project_id}", response_model=TransformationProjectDetailResponse)
def transformation_project_detail(project_id: str):
    project = svc.get_transformation_project(project_id)
    if not project:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Project not found")
    apps = svc.list_project_applications(project_id)
    return TransformationProjectDetailResponse(
        project=TransformationProjectItem(**project),
        application_count=len(apps),
        accepted_count=sum(1 for a in apps if a["status"] == "accepted"),
    )


@router.get("/projects/{project_id}/applications", response_model=TransformationApplicationsResponse)
def transformation_project_applications(project_id: str):
    apps = svc.list_project_applications(project_id)
    items = [TransformationApplicationItem(**a) for a in apps]
    return TransformationApplicationsResponse(applications=items)


@router.post("/applications", response_model=TransformationApplyResponse)
def transformation_apply(payload: TransformationApplyRequest):
    # Check existing
    existing = svc.check_existing_application(payload.projectId, payload.applicantId)
    if existing:
        return TransformationApplyResponse(
            application_id=existing["id"],
            project_id=existing["projectId"],
            status=existing["status"],
            saved=True,
            created_at=existing["createdAt"],
        )
    app = svc.create_transformation_application(payload.model_dump())
    return TransformationApplyResponse(
        application_id=app["id"],
        project_id=app["projectId"],
        status=app["status"],
        saved=True,
        created_at=app["createdAt"],
    )


@router.get("/applications/check/{project_id}/{applicant_id}", response_model=TransformationApplicationItem | None)
def transformation_check_application(project_id: str, applicant_id: str):
    app = svc.check_existing_application(project_id, applicant_id)
    if not app:
        return None
    return TransformationApplicationItem(**app)


@router.put("/applications/{app_id}/status", response_model=TransformationApplicationItem)
def transformation_update_status(app_id: str, status: str = Query(...)):
    app = svc.update_application_status(app_id, status)
    if not app:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Application not found")
    return TransformationApplicationItem(**app)


@router.get("/dashboard/{user_id}/{user_role}", response_model=TransformationDashboardResponse)
def transformation_dashboard(user_id: str, user_role: str):
    projects = svc.get_user_dashboard_projects(user_id, user_role)
    items = [TransformationProjectItem(**p) for p in projects]
    apps = svc.get_user_applications(user_id)
    metrics = [
        {"title": "发布项目", "value": str(len([p for p in projects if p.get("creatorId") == user_id])), "delta": "", "hint": ""},
        {"title": "参与合作", "value": str(len([p for p in projects if p.get("creatorId") != user_id])), "delta": "", "hint": ""},
        {"title": "收到申请", "value": str(sum(1 for a in apps if a.get("projectId") in [p["id"] for p in projects if p.get("creatorId") == user_id])), "delta": "", "hint": ""},
        {"title": "对接成功", "value": str(sum(1 for a in apps if a["status"] == "accepted" and a.get("projectId") in [p["id"] for p in projects if p.get("creatorId") == user_id])), "delta": "", "hint": ""},
    ]
    return TransformationDashboardResponse(metrics=metrics, projects=items)
