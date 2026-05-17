from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Literal


PlatformRole = Literal["student", "enterprise", "school"]


class AuthRegisterRequest(BaseModel):
    role: PlatformRole
    email: str = Field(..., min_length=3, max_length=320)
    password: str = Field(..., min_length=6, max_length=200)
    display_name: str = Field(..., min_length=1, max_length=80)
    # 企业端必填：须先调用公司注册获得 company_id，再凭此加入该企业
    company_id: str | None = None
    # 高校端/企业端试用门禁
    developer_key: str | None = None


class AuthLoginRequest(BaseModel):
    role: PlatformRole
    email: str = Field(..., min_length=3, max_length=320)
    password: str = Field(..., min_length=1, max_length=200)
    # 企业端必填：与注册时绑定的 company_id 一致
    company_id: str | None = None
    # 高校端/企业端试用门禁
    developer_key: str | None = None


class CompanyRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    developer_key: str | None = None


class CompanyRegisterResponse(BaseModel):
    company_id: str
    name: str


class AuthUser(BaseModel):
    id: str
    role: PlatformRole
    email: str
    display_name: str


class AuthSessionResponse(BaseModel):
    token: str
    user: AuthUser


class AuthMeResponse(BaseModel):
    user: AuthUser | None


class AuthLogoutResponse(BaseModel):
    ok: bool = True


class AuthProfileUpdateRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=80)


class AuthProfileUpdateResponse(BaseModel):
    user: AuthUser

