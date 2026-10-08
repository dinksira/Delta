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
    live_duel_pubsub_channel_prefix: str = Field(
        default="live_duel:",
        description="Pub/Sub channel prefix for live-duel room realtime fanout",
    )

    rate_limit_auth_posts_per_minute: int = Field(
        default=120,
        ge=0,
        description="Max POST /v1/auth/* requests per IP per minute (0 disables)",
    )
    rate_limit_code_runs_per_minute: int = Field(
        default=30,
        ge=0,
        description=(
            "Max POST /v1/competitions/{execute,submit} requests per user per minute "
            "(0 disables)"
        ),
    )
    rate_limit_competition_posts_per_minute: int = Field(
        default=20,
        ge=0,
        description=(
            "Max POST /v1/competitions/topic-battles/* writes per user per minute "
            "(0 disables)"
        ),
    )
    judge0_api_base: str = Field(
        default="https://ce.judge0.com",
        description="Judge0 base URL. The default is the public rate-limited CE instance; "
        "point this at a self-hosted Judge0 for production grading.",
    )
    judge0_api_key: str = Field(
        default="",
        description="Optional Judge0 API key sent as X-Auth-Token (self-hosted instances).",
    )
    competition_answer_grace_seconds: int = Field(
        default=5,
        ge=0,
        le=300,
        description=(
            "Grace period added to the server-side deadline before a late answer is "
            "rejected. Absorbs network latency and clock skew so a participant who "
            "genuinely finished in time is not punished."
        ),
    )
    competition_max_integrity_violations: int = Field(
        default=3,
        ge=1,
        le=50,
        description=(
            "Client-reported proctoring violations (tab switch, fullscreen exit, paste) "
            "before a participant is auto-flagged for organizer review. Flagging is "
            "advisory: it never changes a score on its own."
        ),
    )
    competition_latency_variance_sigma: float = Field(
        default=3.0,
        ge=0.1,
        le=10.0,
        description=(
            "Standard deviations below a participant's own median answer latency before "
            "the submission is flagged as implausibly fast."
        ),
    )
    competition_min_answer_seconds: float = Field(
        default=1.0,
        ge=0.0,
        le=60.0,
        description=(
            "Answers reporting a latency under this floor are treated as clock noise and "
            "excluded from the variance baseline."
        ),
    )
    competition_ip_hash_secret: str = Field(
        default="",
        description=(
            "Secret salt for hashing participant IPs in submissions. Required in "
            "non-local environments; without it IPs are not recorded."
        ),
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
        default="local",
        description="Object storage provider identifier (local, s3, r2, gcs)",
    )
    media_storage_bucket: str = Field(
        default="delta-labs-media",
        description="Object storage bucket/container for uploaded media",
    )
    media_upload_base_url: str = Field(
        default="http://127.0.0.1:8081",
        description="Public API origin used to mint local direct-upload URLs (no /v1 suffix). Must match uvicorn host:port.",
    )
    media_local_root: str = Field(
        default=".data/media",
        description="Filesystem root for MEDIA_STORAGE_PROVIDER=local uploads",
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
        default="http://127.0.0.1:8081",
        description="CDN base URL used for playback URLs (local: same as MEDIA_UPLOAD_BASE_URL)",
    )
    media_ingest_shared_secret: str = Field(
        default="replace-media-ingest-secret",
        min_length=8,
        description="Shared secret expected in X-Ingest-Secret for ingest callbacks",
    )
    media_auto_complete_after_upload: bool = Field(
        default=True,
        description=(
            "When true, mark media ready with a progressive playback URL after upload "
            "(local PUT or client complete). Disable when a real transcoder posts ingest."
        ),
    )

    cors_origins: str = Field(
        default="http://localhost:3000",
        description="Comma-separated allowed CORS origins",
    )

    # ── Email delivery ───────────────────────────────────────────────────────
    # resend = production. smtp = Gmail App Password. apps_script = temporary Gmail relay.
    email_provider: Literal["resend", "smtp", "apps_script"] = Field(
        default="resend",
        description="Email transport: resend | smtp | apps_script (temporary)",
    )
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
    smtp_host: str = Field(
        default="smtp.gmail.com",
        description="SMTP host (Gmail: smtp.gmail.com)",
    )
    smtp_port: int = Field(
        default=587,
        ge=1,
        description="SMTP port (Gmail TLS: 587)",
    )
    smtp_user: str = Field(
        default="",
        description="SMTP login — Gmail address when using Google App Password",
    )
    smtp_password: str = Field(
        default="",
        description="SMTP password — Google App Password (not your normal Gmail password)",
    )
    smtp_from_address: str = Field(
        default="",
        description="From email for SMTP; defaults to SMTP_USER when empty",
    )
    apps_script_email_url: str = Field(
        default="",
        description="Deployed Apps Script web app URL (ends with /exec)",
    )
    apps_script_email_secret: str = Field(
        default="",
        description="Shared secret — must match EMAIL_SECRET in Apps Script properties",
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
