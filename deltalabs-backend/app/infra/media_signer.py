"""Direct-upload URL signer abstractions for media storage providers."""

from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import quote

from app.core.config import Settings


# ################################ INFRA ################################
# S3-compatible presigned upload URL generation with local fallback mode.
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
    except Exception:
        return None

    client = boto3.client(
        "s3",
        region_name=settings.media_aws_region,
        endpoint_url=settings.media_s3_endpoint_url,
        aws_access_key_id=key_id,
        aws_secret_access_key=secret,
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


def _fallback_upload_url(*, settings: Settings, object_key: str) -> SignedUpload:
    expires = settings.media_upload_intent_ttl_seconds
    base = settings.media_upload_base_url.rstrip("/")
    encoded_key = quote(object_key, safe="/")
    return SignedUpload(
        upload_url=f"{base}/{encoded_key}?token=replace-with-presigned-token&expires_in={expires}",
        expires_in_seconds=expires,
    )


# ################################ /INFRA ################################
