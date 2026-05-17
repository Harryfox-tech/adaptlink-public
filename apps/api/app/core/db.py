from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from app.core.config import get_settings

UNSUPPORTED_PSYCOPG_QUERY_KEYS = {
    "pgbouncer",
    "pool_timeout",
    "connection_limit",
    "directConnection",
}


def is_db_enabled() -> bool:
    settings = get_settings()
    return bool(settings.database_url)


def get_psycopg_conninfo() -> str | None:
    settings = get_settings()
    raw = settings.database_url
    if not raw:
        return None

    parts = urlsplit(raw)
    query_pairs = parse_qsl(parts.query, keep_blank_values=True)
    filtered = [(k, v) for k, v in query_pairs if k not in UNSUPPORTED_PSYCOPG_QUERY_KEYS]
    normalized = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(filtered), parts.fragment))
    return normalized
