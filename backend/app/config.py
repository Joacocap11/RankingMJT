from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings sourced from environment variables.

    Defaults here are dev-only placeholders; real values are supplied via
    docker-compose environment / .env files that are never committed.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+psycopg://rankingmjt:changeme_local_only@db:5432/rankingmjt"
    CORS_ORIGINS: str = "http://localhost:3003"
    UPLOAD_MAX_MB: int = 5
    UPLOAD_DIR: str = "/app/uploads"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
