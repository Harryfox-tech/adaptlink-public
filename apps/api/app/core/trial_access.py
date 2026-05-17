from __future__ import annotations

from app.core.config import get_settings
from app.schemas.auth import PlatformRole

_TRIAL_GATED_ROLES: frozenset[PlatformRole] = frozenset({"enterprise", "school"})


def requires_trial_developer_key(role: PlatformRole) -> bool:
    return role in _TRIAL_GATED_ROLES


def verify_trial_developer_key(role: PlatformRole, developer_key: str | None) -> str | None:
    if not requires_trial_developer_key(role):
        return None
    expected = get_settings().trial_developer_key
    if (developer_key or "").strip() != expected:
        return "高校端与企业端试商用暂未开放，请输入正确的开发者密钥"
    return None
