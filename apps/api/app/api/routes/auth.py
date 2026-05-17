from fastapi import APIRouter, Header, HTTPException

from app.schemas.auth import (
    AuthLoginRequest,
    AuthLogoutResponse,
    AuthMeResponse,
    AuthProfileUpdateRequest,
    AuthProfileUpdateResponse,
    AuthRegisterRequest,
    AuthSessionResponse,
    CompanyRegisterRequest,
    CompanyRegisterResponse,
)
from app.services import auth_service

router = APIRouter()


def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    if authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None


@router.post("/companies/register", response_model=CompanyRegisterResponse)
def register_company(payload: CompanyRegisterRequest):
    result = auth_service.register_company(name=payload.name)
    if not result.ok or not result.company_id:
        raise HTTPException(status_code=400, detail=result.error or "公司注册失败")
    return CompanyRegisterResponse(company_id=result.company_id, name=result.name or payload.name.strip())


@router.post("/register", response_model=AuthSessionResponse)
def register(payload: AuthRegisterRequest):
    result = auth_service.register(
        role=payload.role,
        email=payload.email,
        password=payload.password,
        display_name=payload.display_name,
        company_id=payload.company_id,
    )
    if not result.ok or not result.token or not result.user:
        raise HTTPException(status_code=400, detail=result.error or "注册失败")
    return AuthSessionResponse(token=result.token, user=result.user)


@router.post("/login", response_model=AuthSessionResponse)
def login(payload: AuthLoginRequest):
    result = auth_service.login(
        role=payload.role,
        email=payload.email,
        password=payload.password,
        company_id=payload.company_id,
    )
    if not result.ok or not result.token or not result.user:
        raise HTTPException(status_code=401, detail=result.error or "登录失败")
    return AuthSessionResponse(token=result.token, user=result.user)


@router.get("/me", response_model=AuthMeResponse)
def me(authorization: str | None = Header(default=None)):
    token = _extract_token(authorization)
    user = auth_service.me(token or "")
    return AuthMeResponse(user=user)


@router.post("/logout", response_model=AuthLogoutResponse)
def logout(authorization: str | None = Header(default=None)):
    token = _extract_token(authorization)
    _ = auth_service.logout(token or "")
    return AuthLogoutResponse(ok=True)


@router.post("/profile", response_model=AuthProfileUpdateResponse)
def update_profile(payload: AuthProfileUpdateRequest, authorization: str | None = Header(default=None)):
    token = _extract_token(authorization)
    result = auth_service.update_profile(token or "", payload.display_name)
    if not result.ok or not result.user:
        raise HTTPException(status_code=401, detail=result.error or "更新失败")
    return AuthProfileUpdateResponse(user=result.user)

