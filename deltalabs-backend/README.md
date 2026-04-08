# Backend (FastAPI)

## Run locally

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

## Quality checks

```bash
ruff check app tests
ruff format --check app tests
mypy app tests
pytest
```

## Environment

Copy `.env.example` to `.env` and adjust values for your local stack.
Core foundation variables include:

- `MONGODB_URI`, `MONGODB_DB_NAME`
- `REDIS_URL`
- `API_V1_PREFIX`
- `AUTHZ_DEFAULT_ORG_SLUG`, `AUTHZ_DEFAULT_ORG_NAME`
- `CORS_ORIGINS`
- `IDEMPOTENCY_HEADER_NAME`, `IDEMPOTENCY_TTL_SECONDS` (foundation scaffold)
- `LOG_LEVEL`
- Media pipeline vars (upload + ingest contracts):
  - `MEDIA_STORAGE_PROVIDER`, `MEDIA_STORAGE_BUCKET`
  - `MEDIA_AWS_REGION`, `MEDIA_S3_ENDPOINT_URL`
  - `MEDIA_S3_ACCESS_KEY_ID`, `MEDIA_S3_SECRET_ACCESS_KEY`
  - `MEDIA_UPLOAD_BASE_URL`, `MEDIA_UPLOAD_INTENT_TTL_SECONDS`
  - `MEDIA_CDN_BASE_URL`, `MEDIA_INGEST_SHARED_SECRET`

### Cloudflare R2 quick setup

Use these values for S3-compatible direct-upload signing via R2:

```env
MEDIA_STORAGE_PROVIDER=r2
MEDIA_STORAGE_BUCKET=delta-labs-media
MEDIA_AWS_REGION=auto
MEDIA_S3_ENDPOINT_URL=https://<accountid>.r2.cloudflarestorage.com
MEDIA_S3_ACCESS_KEY_ID=<r2-access-key-id>
MEDIA_S3_SECRET_ACCESS_KEY=<r2-secret-access-key>
MEDIA_UPLOAD_INTENT_TTL_SECONDS=900
MEDIA_CDN_BASE_URL=https://<your-cdn-domain>
MEDIA_INGEST_SHARED_SECRET=<strong-shared-secret>
```

Example upload-intent request:

```http
POST /v1/orgs/{org_id}/media/upload-intent
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "filename": "lecture-01.mp4",
  "content_type": "video/mp4",
  "file_size_bytes": 73400320,
  "caption": "Intro to molecular biology",
  "hashtags": ["biology", "school"],
  "visibility": "public",
  "publish_to_feed": true
}
```

Example ingest callback request:

```http
POST /v1/media/ingest/callback
X-Ingest-Secret: <MEDIA_INGEST_SHARED_SECRET>
Content-Type: application/json

{
  "mediaId": "<media-id>",
  "status": "ready",
  "durationSeconds": 93.2,
  "manifestHlsUrl": "https://<your-cdn-domain>/org/<org>/media/<id>/master.m3u8",
  "posterUrl": "https://<your-cdn-domain>/org/<org>/media/<id>/poster.jpg",
  "renditions": [
    {"profile": "240p", "url": "https://.../240p.m3u8", "bitrateKbps": 450},
    {"profile": "480p", "url": "https://.../480p.m3u8", "bitrateKbps": 1200},
    {"profile": "720p", "url": "https://.../720p.m3u8", "bitrateKbps": 2500}
  ]
}
```

## Authorization model (RBAC)

- Path-scoped authorization is available for org routes:
  - `/v1/orgs/{org_id}/features`
  - `/v1/orgs/{org_id}/schools`
  - `/v1/orgs/{org_id}/labs`
- Permission checks run through a shared authorization service (membership + role permissions + relationship checks).
- Feature cards are data-driven from catalog metadata and role permissions (capabilities: view/join/create/manage), not hardcoded per feature key.
- Organization lifecycle endpoints:
  - `POST /v1/orgs` (create org and assign `org_owner`)
  - `GET /v1/orgs/me` (list org memberships)
  - `POST /v1/orgs/{org_id}/join` (join an org; assigns baseline role if none)

## Testing layout

- `tests/unit`: isolated unit checks
- `tests/integration`: request/response integration checks

