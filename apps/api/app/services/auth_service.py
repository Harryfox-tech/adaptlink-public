from __future__ import annotations

import base64
import hashlib
import hmac
import os
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock

import psycopg

from app.core.db import get_psycopg_conninfo
from app.schemas.auth import PlatformRole, AuthUser


@dataclass
class AuthResult:
    ok: bool
    error: str | None = None
    token: str | None = None
    user: AuthUser | None = None


@dataclass
class CompanyRegisterResult:
    ok: bool
    error: str | None = None
    company_id: str | None = None
    name: str | None = None


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _conninfo() -> str | None:
    return get_psycopg_conninfo()


_mem_lock = Lock()
_mem_accounts: dict[str, dict[str, dict[str, str]]] = {
    "student": {},
    "enterprise": {},
    "school": {},
}
_mem_sessions: dict[str, dict[str, str]] = {}
# 无 DATABASE_URL 时：已注册的公司 company_id -> 公司名称
_mem_companies: dict[str, str] = {}


def _table_for_role(role: PlatformRole) -> str:
    if role == "student":
        return "app_auth_students"
    if role == "enterprise":
        return "app_auth_enterprise"
    return "app_auth_school"


def _pbkdf2_hash(password: str, salt: bytes, iterations: int = 120_000) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)


def _encode_pwd_hash(password: str) -> str:
    # 格式：pbkdf2_sha256$<iterations>$<salt_b64>$<hash_b64>
    iterations = 120_000
    salt = os.urandom(16)
    pwd_hash = _pbkdf2_hash(password, salt, iterations)
    return "pbkdf2_sha256${}${}${}".format(
        iterations,
        base64.b64encode(salt).decode("ascii"),
        base64.b64encode(pwd_hash).decode("ascii"),
    )


def _verify_pwd_hash(password: str, encoded: str) -> bool:
    try:
        algo, iters_s, salt_b64, hash_b64 = encoded.split("$", 3)
        if algo != "pbkdf2_sha256":
            return False
        iterations = int(iters_s)
        salt = base64.b64decode(salt_b64.encode("ascii"))
        expected = base64.b64decode(hash_b64.encode("ascii"))
        actual = _pbkdf2_hash(password, salt, iterations)
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def _ensure_tables(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS app_enterprise_companies (
                company_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS app_auth_students (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                display_name TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS app_auth_enterprise (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                display_name TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        # Backward-compatible schema evolution
        cur.execute("ALTER TABLE app_auth_enterprise ADD COLUMN IF NOT EXISTS company_id TEXT;")
        cur.execute("ALTER TABLE app_auth_enterprise ADD COLUMN IF NOT EXISTS role TEXT;")
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS app_auth_school (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                display_name TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
    conn.commit()


def _company_exists(company_id: str) -> bool:
    cid = company_id.strip()
    if not cid:
        return False
    if not _conninfo():
        with _mem_lock:
            return cid in _mem_companies
    try:
        with psycopg.connect(_conninfo()) as conn:  # type: ignore[arg-type]
            _ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM app_enterprise_companies WHERE company_id = %s", (cid,))
                return cur.fetchone() is not None
    except Exception:  # noqa: BLE001
        return False


def register_company(name: str) -> CompanyRegisterResult:
    """创建公司实体，返回可供企业账号绑定的 company_id（须先调用再注册企业用户）。"""
    label = name.strip()
    if not label:
        return CompanyRegisterResult(ok=False, error="公司名称不能为空")

    company_id = f"c_{secrets.token_hex(8)}"
    conninfo = _conninfo()
    if not conninfo:
        with _mem_lock:
            _mem_companies[company_id] = label
        return CompanyRegisterResult(ok=True, company_id=company_id, name=label)

    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO app_enterprise_companies (company_id, name) VALUES (%s, %s)",
                    (company_id, label),
                )
            conn.commit()
        return CompanyRegisterResult(ok=True, company_id=company_id, name=label)
    except psycopg.errors.UniqueViolation:
        return CompanyRegisterResult(ok=False, error="公司 ID 冲突，请重试")
    except Exception as exc:  # noqa: BLE001
        return CompanyRegisterResult(ok=False, error=str(exc))


def register(
    role: PlatformRole,
    email: str,
    password: str,
    display_name: str,
    company_id: str | None = None,
) -> AuthResult:
    conninfo = _conninfo()
    if not conninfo:
        # 与平台其他模块一致：DATABASE_URL 不可用时退回内存 mock（仍可演示注册登录流程）
        normalized_email = email.strip().lower()
        if not normalized_email:
            return AuthResult(ok=False, error="邮箱不能为空")
        with _mem_lock:
            if normalized_email in _mem_accounts[role]:
                return AuthResult(ok=False, error="该端账号邮箱已注册")
            account_id = f"{role}_{secrets.token_hex(8)}"
            if role == "enterprise":
                ecid = (company_id or "").strip()
                if not ecid:
                    return AuthResult(
                        ok=False,
                        error="企业端注册必须填写 company id（请先在「注册公司」页面创建并获得 company id）",
                    )
                if not _company_exists(ecid):
                    return AuthResult(ok=False, error="company id 不存在或无效，请先注册公司或核对填写")
                _mem_accounts[role][normalized_email] = {
                    "id": account_id,
                    "password_hash": _encode_pwd_hash(password),
                    "display_name": display_name.strip(),
                    "company_id": ecid,
                }
            else:
                _mem_accounts[role][normalized_email] = {
                    "id": account_id,
                    "password_hash": _encode_pwd_hash(password),
                    "display_name": display_name.strip(),
                }
            token = secrets.token_urlsafe(32)
            _mem_sessions[token] = {
                "role": role,
                "account_id": account_id,
                "email": normalized_email,
                "display_name": display_name.strip(),
                "expires_at": (_now() + timedelta(days=7)).isoformat(),
            }
        user = AuthUser(id=account_id, role=role, email=normalized_email, display_name=display_name.strip())
        return AuthResult(ok=True, token=token, user=user)

    normalized_email = email.strip().lower()
    if not normalized_email:
        return AuthResult(ok=False, error="邮箱不能为空")

    account_id = f"{role}_{secrets.token_hex(8)}"
    password_hash = _encode_pwd_hash(password)
    table = _table_for_role(role)

    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            with conn.cursor() as cur:
                if role == "enterprise":
                    ecid = (company_id or "").strip()
                    if not ecid:
                        return AuthResult(
                            ok=False,
                            error="企业端注册必须填写 company id（请先在「注册公司」页面创建并获得 company id）",
                        )
                    if not _company_exists(ecid):
                        return AuthResult(ok=False, error="company id 不存在或无效，请先注册公司或核对填写")
                    cur.execute(
                        f"INSERT INTO {table} (id, email, password_hash, display_name, company_id, role) VALUES (%s, %s, %s, %s, %s, %s)",
                        (account_id, normalized_email, password_hash, display_name.strip(), ecid, "member"),
                    )
                else:
                    cur.execute(
                        f"INSERT INTO {table} (id, email, password_hash, display_name) VALUES (%s, %s, %s, %s)",
                        (account_id, normalized_email, password_hash, display_name.strip()),
                    )

            conn.commit()

        # 会话不落库：仅用于本次进程存活期间的登录态，重启需重新登录。
        token = secrets.token_urlsafe(32)
        with _mem_lock:
            _mem_sessions[token] = {
                "role": role,
                "account_id": account_id,
                "email": normalized_email,
                "display_name": display_name.strip(),
                "expires_at": (_now() + timedelta(days=7)).isoformat(),
            }
        user = AuthUser(id=account_id, role=role, email=normalized_email, display_name=display_name.strip())
        return AuthResult(ok=True, token=token, user=user)
    except psycopg.errors.UniqueViolation:
        return AuthResult(ok=False, error="该端账号邮箱已注册")
    except psycopg.OperationalError as exc:
        return AuthResult(ok=False, error=f"数据库连接失败：{exc}")
    except Exception as exc:  # noqa: BLE001
        return AuthResult(ok=False, error=str(exc))


def login(
    role: PlatformRole,
    email: str,
    password: str,
    company_id: str | None = None,
) -> AuthResult:
    conninfo = _conninfo()
    if not conninfo:
        normalized_email = email.strip().lower()
        with _mem_lock:
            row = _mem_accounts[role].get(normalized_email)
            if not row:
                return AuthResult(ok=False, error="账号或密码错误")
            if not _verify_pwd_hash(password, row["password_hash"]):
                return AuthResult(ok=False, error="账号或密码错误")
            if role == "enterprise":
                cid_req = (company_id or "").strip()
                if not cid_req:
                    return AuthResult(ok=False, error="企业端登录必须填写 company id")
                if row.get("company_id") != cid_req:
                    return AuthResult(ok=False, error="company id 与账号不匹配")
            token = secrets.token_urlsafe(32)
            _mem_sessions[token] = {
                "role": role,
                "account_id": row["id"],
                "email": normalized_email,
                "display_name": row["display_name"],
                "expires_at": (_now() + timedelta(days=7)).isoformat(),
            }
        user = AuthUser(id=row["id"], role=role, email=normalized_email, display_name=row["display_name"])
        return AuthResult(ok=True, token=token, user=user)

    normalized_email = email.strip().lower()
    table = _table_for_role(role)

    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            with conn.cursor() as cur:
                if role == "enterprise":
                    cur.execute(
                        f"SELECT id, password_hash, display_name, company_id FROM {table} WHERE email = %s",
                        (normalized_email,),
                    )
                else:
                    cur.execute(
                        f"SELECT id, password_hash, display_name FROM {table} WHERE email = %s",
                        (normalized_email,),
                    )
                row = cur.fetchone()
                if not row:
                    return AuthResult(ok=False, error="账号或密码错误")
                if role == "enterprise":
                    account_id, password_hash, display_name, stored_cid = row
                else:
                    account_id, password_hash, display_name = row
                    stored_cid = None
                if not _verify_pwd_hash(password, password_hash):
                    return AuthResult(ok=False, error="账号或密码错误")
                if role == "enterprise":
                    cid_req = (company_id or "").strip()
                    if not cid_req:
                        return AuthResult(ok=False, error="企业端登录必须填写 company id")
                    if stored_cid:
                        if str(stored_cid) != cid_req:
                            return AuthResult(ok=False, error="company id 与账号不匹配")
                    else:
                        # 旧账号：首次用有效 company id 登录时完成绑定
                        if not _company_exists(cid_req):
                            return AuthResult(ok=False, error="company id 不存在或无效")
                        cur.execute(
                            "UPDATE app_auth_enterprise SET company_id = %s, role = COALESCE(role, 'member') WHERE id = %s",
                            (cid_req, account_id),
                        )
            conn.commit()

        token = secrets.token_urlsafe(32)
        with _mem_lock:
            _mem_sessions[token] = {
                "role": role,
                "account_id": account_id,
                "email": normalized_email,
                "display_name": display_name,
                "expires_at": (_now() + timedelta(days=7)).isoformat(),
            }
        user = AuthUser(id=account_id, role=role, email=normalized_email, display_name=display_name)
        return AuthResult(ok=True, token=token, user=user)
    except psycopg.OperationalError as exc:
        return AuthResult(ok=False, error=f"数据库连接失败：{exc}")
    except Exception as exc:  # noqa: BLE001
        return AuthResult(ok=False, error=str(exc))


def me(token: str) -> AuthUser | None:
    if not token:
        return None
    with _mem_lock:
        sess = _mem_sessions.get(token)
        if not sess:
            return None
        try:
            expires_at = datetime.fromisoformat(sess["expires_at"])
            if expires_at < _now():
                _mem_sessions.pop(token, None)
                return None
        except Exception:
            pass
        return AuthUser(
            id=sess["account_id"],
            role=sess["role"],  # type: ignore[arg-type]
            email=sess["email"],
            display_name=sess["display_name"],
        )


def logout(token: str) -> bool:
    if not token:
        return True
    with _mem_lock:
        _mem_sessions.pop(token, None)
    return True


def update_profile(token: str, display_name: str) -> AuthResult:
    if not token:
        return AuthResult(ok=False, error="未登录")

    name = display_name.strip()
    if not name:
        return AuthResult(ok=False, error="昵称不能为空")

    with _mem_lock:
        sess = _mem_sessions.get(token)
        if not sess:
            return AuthResult(ok=False, error="未登录")
        sess["display_name"] = name
        role = sess["role"]
        account_id = sess["account_id"]
        email = sess["email"]

    conninfo = _conninfo()
    if not conninfo:
        return AuthResult(ok=True, user=AuthUser(id=account_id, role=role, email=email, display_name=name), token=token)  # type: ignore[arg-type]

    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            table = _table_for_role(role)  # type: ignore[arg-type]
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {table} SET display_name = %s WHERE id = %s", (name, account_id))
            conn.commit()
        return AuthResult(ok=True, user=AuthUser(id=account_id, role=role, email=email, display_name=name), token=token)  # type: ignore[arg-type]
    except psycopg.OperationalError as exc:
        return AuthResult(ok=False, error=f"数据库连接失败：{exc}")
    except Exception as exc:  # noqa: BLE001
        return AuthResult(ok=False, error=str(exc))


def _get_session(token: str) -> dict[str, str] | None:
    if not token:
        return None
    with _mem_lock:
        sess = _mem_sessions.get(token)
        if not sess:
            return None
        try:
            expires_at = datetime.fromisoformat(sess["expires_at"])
            if expires_at < _now():
                _mem_sessions.pop(token, None)
                return None
        except Exception:
            pass
        return dict(sess)


def require_user(token: str, role: PlatformRole) -> AuthUser:
    sess = _get_session(token)
    if not sess:
        raise ValueError("未登录")
    if sess.get("role") != role:
        raise ValueError("无权限")
    return AuthUser(
        id=sess["account_id"],
        role=role,
        email=sess["email"],
        display_name=sess["display_name"],
    )


def get_enterprise_company_id(enterprise_user_id: str) -> str | None:
    """返回企业用户已绑定的 company_id（注册/登录时显式写入；无则返回 None）。"""
    conninfo = _conninfo()
    if not conninfo:
        with _mem_lock:
            for _email, row in _mem_accounts["enterprise"].items():
                if row.get("id") == enterprise_user_id:
                    cid = row.get("company_id")
                    return str(cid) if cid else None
        return None

    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_tables(conn)
            with conn.cursor() as cur:
                cur.execute("SELECT company_id FROM app_auth_enterprise WHERE id = %s", (enterprise_user_id,))
                row = cur.fetchone()
                if not row:
                    return None
                cid = row[0]
                return str(cid) if cid else None
    except Exception:  # noqa: BLE001
        return None

