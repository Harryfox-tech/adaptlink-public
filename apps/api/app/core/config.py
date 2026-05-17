from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("apps/api/.env", ".env"), extra="ignore")

    app_name: str = "Talent Platform API"
    api_prefix: str = "/api/v1"
    debug: bool = True
    database_url: str | None = None

    # AI runtime config: real-model first, mock fallback.
    ai_provider: str = "mock"  # mock | openai
    openai_api_key: str | None = None
    openai_base_url: str | None = None
    openai_model: str = "gpt-4.1-mini"
    llm_timeout_seconds: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
