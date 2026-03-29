from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AMPLY_", env_file=".env", extra="ignore")

    # Comma-separated API keys for agents (MVP). Empty = no auth (dev only).
    api_keys: str = ""
    rate_limit_per_minute: int = 1000


def get_api_key_set() -> set[str]:
    s = Settings()
    if not s.api_keys.strip():
        return set()
    return {k.strip() for k in s.api_keys.split(",") if k.strip()}
