"""Application settings loaded from environment (see `.env.example`)."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

EnvironmentName = Literal["local", "staging", "production"]


class Settings(BaseSettings):
    """Runtime configuration; no secrets committed — use env / deployment secrets."""

    # ################################ CONFIG ################################
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
    mongodb_max_pool_size: int = Field(
        default=100,
        ge=1,
        description="Motor / PyMongo max connection pool size",
    )
    mongodb_min_pool_size: int = Field(
        default=0,
        ge=0,
        description="Motor / PyMongo min pool size",
    )
    mongodb_server_selection_timeout_ms: int = Field(
        default=5000,
        ge=1,
        description="Server selection timeout (ms)",
    )

    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL",
    )
    redis_max_connections: int = Field(
        default=50,
        ge=1,
        description="Max connections in the Redis asyncio pool",
    )

    http_timeout_seconds: float = Field(
        default=30.0,
        gt=0,
        description="Default timeout for the shared httpx AsyncClient (seconds)",
    )
    log_level: str = Field(default="INFO", description="Application log level")

    jwt_secret: str = Field(
        default="dev-only-replace-in-production",
        min_length=1,
        description="Signing key for JWTs (set via env in non-local)",
    )
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=60, ge=1)

    api_v1_prefix: str = Field(default="/v1", description="Mounted API version prefix")
    authz_default_org_slug: str = Field(
        default="delta-labs",
        min_length=2,
        description="Default org slug used for compatibility wrappers and local bootstrap",
    )
    authz_default_org_name: str = Field(
        default="Delta Labs",
        min_length=2,
        description="Default org display name used during authz bootstrap",
    )
    idempotency_header_name: str = Field(
        default="Idempotency-Key",
        description="Header used to carry idempotency keys",
    )
    idempotency_ttl_seconds: int = Field(
        default=24 * 60 * 60,
        ge=1,
        description="Planned Redis TTL for idempotency records",
    )
    feed_engagement_stream_key: str = Field(
        default="feed:engagement:events",
        description="Redis Stream key for feed engagement events",
    )
    feed_engagement_stream_maxlen: int = Field(
        default=100_000,
        ge=1000,
        description="Approximate max length for feed engagement stream",
    )
    feed_engagement_dead_letter_stream_key: str = Field(
        default="feed:engagement:dead_letter",
        description="Redis Stream key for failed feed engagement worker events",
    )
    feed_engagement_dead_letter_stream_maxlen: int = Field(
        default=50_000,
        ge=1000,
        description="Approximate max length for dead-letter stream",
    )
    feed_worker_max_retries: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Max worker retries before sending event to dead-letter stream",
    )
    feed_engagement_pubsub_channel_prefix: str = Field(
        default="feed:clip:",
        description="Pub/Sub channel prefix for clip-level realtime fanout",
    )

    rate_limit_auth_posts_per_minute: int = Field(
        default=120,
        ge=0,
        description="Max POST /v1/auth/* requests per IP per minute (0 disables)",
    )
    trust_x_forwarded_for: bool = Field(
        default=False,
        description="If true, use first X-Forwarded-For hop as client IP for rate limits",
    )
    marketplace_bid_cooldown_seconds: int = Field(
        default=60,
        ge=0,
        description="Cooldown between consecutive bid/buy submissions on the same listing by the same bidder (0 disables).",
    )
    marketplace_bid_expiry_hours: int = Field(
        default=72,
        ge=1,
        description="Hours until marketplace transfer offers expire.",
    )
    marketplace_max_amendment_rounds: int = Field(
        default=3,
        ge=0,
        description="Maximum amendment rounds allowed for marketplace transfer offers (0 disables amendments).",
    )
    marketplace_bid_rate_limit_window_seconds: int = Field(
        default=3600,
        ge=1,
        description="Rolling time window for marketplace bid creation rate limits.",
    )
    marketplace_bid_rate_limit_max_creates: int = Field(
        default=20,
        ge=0,
        description="Maximum marketplace bid/buy creations allowed per bidder within the configured window (0 disables).",
    )
    media_storage_provider: str = Field(
        default="s3",
        description="Object storage provider identifier (e.g. s3, r2, gcs)",
    )
    media_storage_bucket: str = Field(
        default="delta-labs-media",
        description="Object storage bucket/container for uploaded media",
    )
    media_upload_base_url: str = Field(
        default="https://upload.example.com",
        description="Base URL used to mint direct-upload intent URLs",
    )
    media_aws_region: str = Field(
        default="us-east-1",
        description="AWS region for S3-compatible signing",
    )
    media_s3_endpoint_url: str | None = Field(
        default=None,
        description="Optional S3-compatible endpoint URL (use for R2/MinIO)",
    )
    media_s3_access_key_id: str | None = Field(
        default=None,
        description="Access key used for S3-compatible direct-upload signing",
    )
    media_s3_secret_access_key: str | None = Field(
        default=None,
        description="Secret key used for S3-compatible direct-upload signing",
    )
    media_upload_intent_ttl_seconds: int = Field(
        default=900,
        ge=60,
        le=3600,
        description="TTL for presigned upload URLs",
    )
    media_cdn_base_url: str = Field(
        default="https://cdn.example.com",
        description="CDN base URL used for playback URLs",
    )
    media_ingest_shared_secret: str = Field(
        default="replace-media-ingest-secret",
        min_length=8,
        description="Shared secret expected in X-Ingest-Secret for ingest callbacks",
    )

    cors_origins: str = Field(
        default="http://localhost:3000",
        description="Comma-separated allowed CORS origins",
    )

    # ── Email delivery (Resend — HTTPS, works on all cloud providers) ────────
    resend_api_key: str = Field(
        default="",
        description="Resend API key — get from resend.com",
    )
    resend_from_address: str = Field(
        default="onboarding@resend.dev",
        description="From address — use onboarding@resend.dev for testing, or your verified domain",
    )
    email_from_name: str = Field(
        default="DeltaLabs",
        description="Display name shown in the From field",
    )

    # ── Session limits ────────────────────────────────────────────────────────
    max_sessions_per_user: int = Field(
        default=5,
        ge=1,
        description="Maximum concurrent active sessions per user",
    )

    # ── Age validation ────────────────────────────────────────────────────────
    min_user_age_years: int = Field(
        default=13,
        ge=1,
        description="Minimum age in years required to register",
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


# ################################ /CONFIG ################################
