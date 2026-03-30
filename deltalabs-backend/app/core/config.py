"""Application settings loaded from environment (see `.env.example`)."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

EnvironmentName = Literal["local", "staging", "production"]


class Settings(BaseSettings):
    """Runtime configuration; no secrets committed — use env / deployment secrets."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    env: EnvironmentName = Field(default="local", description="Deployment environment")

    mongodb_uri: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection URI",
    )
    mongodb_db_name: str = Field(default="deltalabs", description="MongoDB database name")

    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL",
    )

    jwt_secret: str = Field(
        default="dev-only-replace-in-production",
        min_length=1,
        description="Signing key for JWTs (set via env in non-local)",
    )
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=60, ge=1)

    api_v1_prefix: str = Field(default="/v1", description="Mounted API version prefix")

    cors_origins: str = Field(
        default="http://localhost:3000",
        description="Comma-separated allowed CORS origins",
    )

    app_name: str = Field(default="Delta Labs API")
    api_version: str = Field(default="0.1.0")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def strip_cors_origins(cls, value: object) -> str:
        if isinstance(value, str):
            return value.strip()
        return str(value)

    def cors_origin_list(self) -> list[str]:
        """Parse `cors_origins` into a list for Starlette/FastAPI middleware."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return process-wide settings (cached)."""
    return Settings()
