from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import asyncpg

# Singleton — created once at startup in main.py:lifespan
_pool: asyncpg.Pool | None = None


def set_pool(pool: asyncpg.Pool) -> None:
    global _pool
    _pool = pool


def get_pool() -> asyncpg.Pool | None:
    """Return the shared asyncpg pool, or None if DB is not configured."""
    return _pool


def require_pool() -> asyncpg.Pool:
    """Return the pool or raise if DB mode is disabled."""
    if _pool is None:
        raise RuntimeError(
            "Database pool is not initialised (DATABASE_URL is not set or startup failed). "
            "Ensure the API was started with DATABASE_URL in the environment."
        )
    return _pool
