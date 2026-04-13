# Delta Labs Feed + FYP Architecture

## Purpose

This document defines the Feed and For-You-Page (FYP) architecture for Delta Labs, including:

- Current implemented behavior in backend/frontend
- Ranking algorithm model (present + near-term)
- Event ingestion and personalization signals
- Media upload + ingest pipeline contracts
- Scalability and reliability plan for school-generated content at large scale

The goal is to keep the system **simple for low inventory now** (10-20 videos) and **production-ready for high inventory later** (many schools uploading continuously).

---

## Current System Snapshot

### Feed Read APIs

- `GET /v1/feed`
  - Cursor pagination (`next_cursor`, `has_more`)
  - Optional filter: `content_type`
  - Public access allowed
  - Uses optional auth context when bearer token exists

- `GET /v1/feed/{item_id}`
  - Fetch single feed item by id

### Engagement APIs

- `POST /v1/feed/{item_id}/like`
- `POST /v1/feed/{item_id}/save`
- `POST /v1/feed/{item_id}/comment`
- `POST /v1/feed/{item_id}/share`
- `POST /v1/feed/{item_id}/enroll` (placeholder)

All write endpoints:
- Require authenticated session
- Use idempotency support (`Idempotency-Key`)
- Update engagement collections used by ranking

### Feed Telemetry API (FYP Signals)

- `POST /v1/feed/{item_id}/event`
  - Events: `view_start`, `view_complete`, `skip`, `hide`
  - Optional metrics: `watch_ms`, `position_ms`
  - Auth required
  - Stored in `content_events`

---

## Feed Data Model

## `content_items` (feed display model)

Primary fields used today:
- `_id` (content id)
- `visibility` (`public`/...)
- `content_type` (`video`)
- `created_at`, `updated_at`
- `video_src` (current playback URL)
- `caption`, `hashtags`
- `like_count` (display)

### `content_events` (telemetry model)

Used for ranking signals:
- `_id`
- `content_id`
- `user_id`
- `event`
- `watch_ms`
- `position_ms`
- `created_at`

Indexes:
- `(user_id, created_at)` for per-user signal retrieval
- `(content_id, event, created_at)` for analytics and model features

### Engagement collections

- `content_likes`
- `content_saves`
- `content_comments`
- `content_shares`

Used for affinity and relevance scoring.

---

## Ranking Architecture (Implemented)

## Step 1: Candidate retrieval

Backend retrieves cursor page from `content_items` (public + optional content type).

For authenticated users, retrieval excludes:
- hidden ids (`hide` event)
- watched ids (`view_complete` or high watch duration threshold)

Fallback behavior:
- If exclusion yields empty page (low inventory), backend gracefully falls back to non-excluded query so feed remains populated.

## Step 2: Signal profile build

For authenticated users:

- Hashtag affinity weights from recently engaged content
- Event-based per-item boosts/penalties:
  - `view_complete`: positive
  - `view_start`: small positive
  - `skip`: negative
  - `hide`: hard exclusion
  - `watch_ms`: additive bounded boost

## Step 3: Score and rerank

Current weighted blend:

- Recency score
- Hashtag affinity score
- Event score
- Small deterministic jitter

This produces user-specific ordering while preserving stable pagination behavior.

## Step 4: Low-inventory safeguards

- Cold-start deterministic shuffle when profile is sparse
- Fallback to available videos when exclusions over-filter

This is essential for current low-volume public feed.

### Deterministic cold-start shuffle algorithm (exact)

When a logged-in user has sparse/no personalization signals, backend uses a deterministic per-user shuffle:

1. Build seed text: `"{user_id}:{cursor_token or 'first'}"`
2. Compute SHA-256 hash of that seed text
3. Take first 16 hex chars, convert to integer seed
4. Initialize RNG with that seed
5. Shuffle the candidate docs with that seeded RNG

Implementation behavior:
- Same user + same cursor page => same order (stable pagination UX)
- Different user => different seed => different starting order
- Next cursor page changes seed input, so ordering remains deterministic per page

This is implemented in content service method `_stable_user_shuffle(...)`.

---

## Frontend Runtime Behavior

### Feed source strategy

- Primary: backend feed API (`/v1/feed`)
- Fallback: local mock clips when backend unavailable

### Event emission

Frontend emits events to backend:
- `view_start` when active clip session begins
- `view_complete` when completion threshold reached
- `skip` when leaving clip before completion
- `hide` from "Not interested"

Emission is gated to authenticated users to avoid noisy unauthorized requests.

### UX optimizations

- Immediate local hide (clip removed from current client view instantly)
- Video preloading strategy:
  - Near active index (about +/-4): `preload="auto"`
  - Others: `preload="metadata"`

Result: smoother snap-scroll playback and lower perceived latency.

---

## Media Ingestion Architecture (Implemented Contract)

## Org-scoped upload intent

- `POST /v1/orgs/{org_id}/media/upload-intent`
  - Returns upload contract:
    - `mediaId`
    - `objectKey`
    - `uploadUrl` (presigned/fallback)
    - TTL/provider/bucket metadata

## Ingest callback

- `POST /v1/media/ingest/callback`
  - Protected with `X-Ingest-Secret`
  - Updates media asset status and renditions
  - On `ready` + `publish_to_feed=true` -> upserts item into `content_items`

## Media metadata store

`media_assets` stores:
- owner/org
- source metadata
- status
- visibility
- caption/hashtags
- upload object key
- HLS/poster URLs
- duration/renditions

No raw video blobs in MongoDB.

---

## Object Storage and Delivery Strategy

### Recommended stack

- Storage: S3-compatible object storage (AWS S3, Cloudflare R2, GCS-S3 layer)
- Delivery: CDN in front of media
- Playback format: HLS/DASH adaptive streaming
- Access control: signed URLs where needed

### Presigned upload support

Backend now supports S3-compatible signing with provider config:
- `MEDIA_STORAGE_PROVIDER=s3|r2`
- S3/R2 endpoint + credentials
- URL TTL controls

If credentials are absent, system falls back to non-production placeholder upload URL mode.

---

## Security and Reliability

### Security

- Session auth for feed writes and telemetry
- Idempotency on write endpoints
- Ingest callback secret validation
- Org-scoped media operations

### Reliability

- Redis unavailability paths fail-open where appropriate
- Low-inventory fallback prevents blank feed
- Deterministic ranking behavior to avoid unstable UX

---

## Scaling Plan (Next Phases)

## Phase A: Stronger online ranking features

- Creator affinity
- Session intent features
- Topic diversity constraints
- Exploration quota controls

## Phase B: Streaming/near-real-time features

- Async event pipeline (Kafka/Redis Streams/PubSub)
- Feature materialization jobs
- Batch + real-time hybrid scoring

## Phase C: ML ranking layer

- Offline training from event logs
- Online feature store
- Model serving endpoint with AB testing

## Phase D: Moderation and policy controls

- Safety classifiers
- School/org policy rules
- Quality and trust score integration

---

## Operational Checklist

Before production launch:

1. Configure S3/R2 credentials and endpoint
2. Set strong ingest callback secret
3. Add transcoder worker pipeline
4. Enforce HLS output + CDN delivery
5. Add feed/ranking dashboards and SLOs
6. Run load tests for feed read + event write paths
7. Validate fallback behavior under low inventory and dependency degradation

---

## Summary

Delta Labs feed architecture now has:

- Practical low-volume behavior today
- Functional personalized FYP signal loop
- Watch/hide filtering and smoother playback UX
- Upload-ready media ingestion contracts for school content
- Clear path to full-scale ranking + media pipeline evolution

This keeps current MVP velocity while establishing long-term platform-grade foundations.
