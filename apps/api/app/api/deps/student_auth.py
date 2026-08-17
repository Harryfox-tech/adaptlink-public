from __future__ import annotations

from fastapi import Header, HTTPException

from app.schemas.auth import AuthUser
from app.services import auth_service


def extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    if authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None


def require_student(authorization: str | None = Header(default=None)) -> AuthUser:
    token = extract_bearer_token(authorization)
    try:
        return auth_service.require_user(token or "", role="student")
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


def assert_student_access(user: AuthUser, student_id: str) -> None:
    if user.id != student_id:
        raise HTTPException(status_code=403, detail="无权访问其他学生数据")
