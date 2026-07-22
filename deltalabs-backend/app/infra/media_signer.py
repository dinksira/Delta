"""Direct-upload URL signer abstractions for media storage providers."""

from __future__ import annotations

import hashlib
import hmac
import time
from dataclasses import dataclass
from urllib.parse import quote

from app.core.config import Settings


# ################################ INFRA ################################
# S3-compatible presigned upload URL generation with local disk mode.
@dataclass(slots=True)
class SignedUpload:
    upload_url: str
    expires_in_seconds: int


def sign_media_upload_put_url(
    *,
    settings: Settings,
    object_key: str,
    content_type: str,
) -> SignedUpload:
    provider = settings.media_storage_provider.strip().lower()
    if provider in {"s3", "r2"}:
        signed = _try_sign_s3_compatible_upload(
            settings=settings,
            object_key=object_key,
            content_type=content_type,
        )
        if signed is not None:
            return signed
        # Local/dev convenience: fall back to disk when cloud keys are missing.
        if settings.env == "local":
            return _local_upload_url(settings=settings, object_key=object_key)
    if provider == "local" or settings.env == "local":
        return _local_upload_url(settings=settings, object_key=object_key)
    return _fallback_upload_url(settings=settings, object_key=object_key)


def _try_sign_s3_compatible_upload(
    *,
    settings: Settings,
    object_key: str,
    content_type: str,
) -> SignedUpload | None:
    key_id = (settings.media_s3_access_key_id or "").strip()
    secret = (settings.media_s3_secret_access_key or "").strip()
    if not key_id or not secret:
        return None
    try:
        import boto3  # type: ignore[import-not-found]
        from botocore.client import Config as BotoConfig  # type: ignore[import-not-found]
    except Exception:
        return None

    client = boto3.client(
        "s3",
        region_name=settings.media_aws_region,
        endpoint_url=settings.media_s3_endpoint_url,
        aws_access_key_id=key_id,
        aws_secret_access_key=secret,
        config=BotoConfig(
            signature_version="s3v4",
            s3={"addressing_style": "path" if settings.media_s3_endpoint_url else "auto"},
        ),
    )
    expires = settings.media_upload_intent_ttl_seconds
    url = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.media_storage_bucket,
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=expires,
        HttpMethod="PUT",
    )
    return SignedUpload(upload_url=str(url), expires_in_seconds=expires)


def _local_signing_secret(settings: Settings) -> bytes:
    raw = (settings.media_ingest_shared_secret or "local-media-dev-secret").encode("utf-8")
    return raw


def build_local_upload_signature(*, settings: Settings, object_key: str, expires_at: int) -> str:
    message = f"{object_key}:{expires_at}".encode("utf-8")
    return hmac.new(_local_signing_secret(settings), message, hashlib.sha256).hexdigest()


def verify_local_upload_signature(
    *,
    settings: Settings,
    object_key: str,
    expires_at: int,
    signature: str,
) -> bool:
    if expires_at < int(time.time()):
        return False
    expected = build_local_upload_signature(
        settings=settings,
        object_key=object_key,
        expires_at=expires_at,
    )
    return hmac.compare_digest(expected, signature.strip().lower())


def _local_upload_url(*, settings: Settings, object_key: str) -> SignedUpload:
    expires = settings.media_upload_intent_ttl_seconds
    expires_at = int(time.time()) + expires
    signature = build_local_upload_signature(
        settings=settings,
        object_key=object_key,
        expires_at=expires_at,
    )
    base = settings.media_upload_base_url.rstrip("/")
    prefix = settings.api_v1_prefix.rstrip("/")
    encoded_key = quote(object_key, safe="/")
    upload_url = (
        f"{base}{prefix}/media/local-upload/{encoded_key}"
        f"?expires={expires_at}&sig={signature}"
    )
    return SignedUpload(upload_url=upload_url, expires_in_seconds=expires)


def _fallback_upload_url(*, settings: Settings, object_key: str) -> SignedUpload:
    expires = settings.media_upload_intent_ttl_seconds
    base = settings.media_upload_base_url.rstrip("/")
    encoded_key = quote(object_key, safe="/")
    return SignedUpload(
        upload_url=f"{base}/{encoded_key}?token=replace-with-presigned-token&expires_in={expires}",
        expires_in_seconds=expires,
    )


# ################################ /INFRA ################################
