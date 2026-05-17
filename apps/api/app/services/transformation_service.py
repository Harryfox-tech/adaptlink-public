from __future__ import annotations

import uuid
from datetime import datetime

# In-memory store for P0 demo (replaces real DB until Prisma migration is run)
_projects_store: dict[str, dict] = {}
_applications_store: dict[str, dict] = {}


def _dt() -> str:
    return datetime.utcnow().isoformat()


# ── Projects ────────────────────────────────────────────────────

def list_transformation_projects(
    creator_role: str | None = None,
    project_type: str | None = None,
    status: str | None = None,
    domain: str | None = None,
) -> list[dict]:
    results = []
    for p in _projects_store.values():
        if creator_role and p["creatorRole"] != creator_role:
            continue
        if project_type and p["projectType"] != project_type:
            continue
        if status and p["status"] != status:
            continue
        if domain and p["domain"] != domain:
            continue
        results.append(p)
    return results


def get_transformation_project(project_id: str) -> dict | None:
    return _projects_store.get(project_id)


def create_transformation_project(payload: dict) -> dict:
    project_id = str(uuid.uuid4())
    now = _dt()
    project = {
        "id": project_id,
        "creatorId": payload["creatorId"],
        "creatorRole": payload["creatorRole"],
        "projectType": payload["projectType"],
        "title": payload["title"],
        "description": payload["description"],
        "domain": payload["domain"],
        "maturityLevel": payload.get("maturityLevel"),
        "budgetRange": payload.get("budgetRange"),
        "cooperationMode": payload.get("cooperationMode"),
        "requiredAbilities": payload.get("requiredAbilities", []),
        "status": "open",
        "contactName": payload["contactName"],
        "contactEmail": payload["contactEmail"],
        "contactPhone": payload.get("contactPhone"),
        "createdAt": now,
        "updatedAt": now,
    }
    _projects_store[project_id] = project
    return project


def update_transformation_project_status(project_id: str, status: str) -> dict | None:
    p = _projects_store.get(project_id)
    if not p:
        return None
    p["status"] = status
    p["updatedAt"] = _dt()
    return p


# ── Applications ─────────────────────────────────────────────────

def list_project_applications(project_id: str) -> list[dict]:
    return [a for a in _applications_store.values() if a["projectId"] == project_id]


def get_user_applications(applicant_id: str) -> list[dict]:
    return [a for a in _applications_store.values() if a["applicantId"] == applicant_id]


def check_existing_application(project_id: str, applicant_id: str) -> dict | None:
    for a in _applications_store.values():
        if a["projectId"] == project_id and a["applicantId"] == applicant_id and a["status"] == "pending":
            return a
    return None


def create_transformation_application(payload: dict) -> dict:
    # Reject duplicate pending
    existing = check_existing_application(payload["projectId"], payload["applicantId"])
    if existing:
        return existing

    app_id = str(uuid.uuid4())
    now = _dt()
    app = {
        "id": app_id,
        "projectId": payload["projectId"],
        "applicantId": payload["applicantId"],
        "applicantRole": payload["applicantRole"],
        "status": "pending",
        "message": payload.get("message"),
        "abilities": payload.get("abilities", []),
        "createdAt": now,
        "updatedAt": now,
    }
    _applications_store[app_id] = app
    return app


def update_application_status(app_id: str, status: str) -> dict | None:
    a = _applications_store.get(app_id)
    if not a:
        return None
    a["status"] = status
    a["updatedAt"] = _dt()
    return a


# ── Stats ────────────────────────────────────────────────────────

def get_transformation_stats() -> dict:
    projects = list(_projects_store.values())
    apps = list(_applications_store.values())
    return {
        "total_projects": len(projects),
        "open_projects": sum(1 for p in projects if p["status"] == "open"),
        "matched_projects": sum(1 for p in projects if p["status"] == "matched"),
        "total_applications": len(apps),
        "accepted_applications": sum(1 for a in apps if a["status"] == "accepted"),
    }


def get_user_dashboard_projects(user_id: str, user_role: str) -> list[dict]:
    # Published by this user
    owned = [p for p in _projects_store.values() if p["creatorId"] == user_id]
    # Applications submitted by this user (accepted → collaborating)
    my_apps = [a for a in _applications_store.values() if a["applicantId"] == user_id and a["status"] == "accepted"]
    collaborating = []
    for a in my_apps:
        p = _projects_store.get(a["projectId"])
        if p:
            collaborating.append(p)
    return owned + collaborating
