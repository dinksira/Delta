# Delta Labs data model

This document describes how persisted data is structured in the Delta Labs monorepo. The backend uses **MongoDB** for durable documents and **Redis** for ephemeral data, streams, and rate limiting. There is no relational SQL schema in the repository; shapes follow Python repositories under `deltalabs-backend/app/domain/*/repository.py` and Pydantic models in `schemas.py` where they align with storage.

**Default MongoDB database name:** `deltalabs` (override with `MONGODB_DB_NAME`).  
**Connection:** `MONGODB_URI` — see `deltalabs-backend/app/core/config.py` and `app/infra/database.py`.

---

## Database overview

Delta Labs uses **two persistence layers**:

| Layer | Technology | Role |
|-------|------------|------|
| **Primary store** | MongoDB (`deltalabs`) | Long-lived documents: users, tenants, schools, marketplace, content, engagement, media pipeline, feature catalog |
| **Ephemeral / coordination** | Redis | Short-lived state (signup flows, OTP, recovery), idempotency keys, rate limits, feed worker streams and cursors |

**Tenancy:** Most business data is scoped by **`org_id`** (organization). Schools, marketplace, workspace, and many queries hang off an org. Users belong to orgs via **`org_memberships`**; school access is modeled separately in **`school_memberships`**.

**Identity and sessions:** **`users`** holds credentials and profile identifiers; **`user_sessions`** stores hashed API tokens with **`expires_at`** (Mongo TTL deletes expired rows).

**Authorization:** **`role_definitions`** is the RBAC catalog (role → permission strings). **`role_bindings`** assigns roles to users within an org and scope (`org`, `school`, etc.). **`relationships`** supports a small set of graph edges (e.g. parent → student) used beside RBAC. See [RBAC role catalog](#rbac-role-catalog).

**Product domains in Mongo:** **School** (`schools`, workspace, marketplace, offers, memberships), **Content** (`content_items` + engagement collections), **Media** (`media_assets` upload/transcode metadata), **Library** (`feature_catalog` for gated UI features).

**Indexes:** Created at app runtime via `ensure_indexes()` per domain repository — full inventory in [MongoDB indexes](#mongodb-indexes).

**Lifecycle:** Only **`user_sessions`** uses a Mongo TTL index; other retention (events volume, Redis TTLs, archival flags like `schools.archived`) is application- or ops-driven. See [Data lifecycle and retention](#data-lifecycle-and-retention).

**Where to read next:** Collection purposes in the table below; field-level tables in [Collection field reference](#collection-field-reference); Redis key patterns in [Redis usage](#redis-usage). **Drivers, env vars, and app startup** are in [Runtime connectivity and configuration](#runtime-connectivity-and-configuration).

---

## Runtime connectivity and configuration

Low-level view: **which databases**, **which Python clients**, **which environment variables**, and **when connections are opened**.

### Where settings live

| Piece | Location |
|-------|----------|
| All tunables | `deltalabs-backend/app/core/config.py` — class `Settings` (Pydantic `BaseSettings`) |
| Cached accessor | `get_settings()` — `@lru_cache` process singleton |
| Env file | `.env` in the backend working directory (see `SettingsConfigDict` `env_file=".env"`) |
| Example copy | `deltalabs-backend/.env.example` |

Environment variable names are **case-insensitive** to pydantic-settings. Underscores in env map to the `snake_case` fields (e.g. `MONGODB_URI` → `mongodb_uri`).

### MongoDB

| Item | Detail |
|------|--------|
| **Engine** | MongoDB (document database); no SQL migrations in-repo |
| **Python driver stack** | **Motor** — `AsyncIOMotorClient` / `AsyncIOMotorDatabase` (`motor.motor_asyncio`) wrapping PyMongo, async-first |
| **Connection module** | `deltalabs-backend/app/infra/database.py` |
| **Startup / shutdown** | `app/main.py` FastAPI `lifespan`: `connect_mongodb()` on startup; `disconnect_mongodb()` on shutdown (after Redis is closed) |
| **Client shape** | One **global** Motor client per process; `get_database()` indexes it with `[settings.mongodb_db_name]` so all repositories share one pool |

**Environment variables (Mongo):**

| Variable | Default | Purpose |
|----------|---------|---------|
| `MONGODB_URI` | `mongodb://localhost:27017` | Full connection string (Atlas, replica set, TLS query params all go here) |
| `MONGODB_DB_NAME` | `deltalabs` | Logical database name within the cluster |
| `MONGODB_MAX_POOL_SIZE` | `100` | `maxPoolSize` on the client |
| `MONGODB_MIN_POOL_SIZE` | `0` | `minPoolSize` |
| `MONGODB_SERVER_SELECTION_TIMEOUT_MS` | `5000` | How long to wait when picking a server before error |

Repositories receive the database handle from FastAPI dependencies (`get_db` yields `get_database()`).

### Redis

| Item | Detail |
|------|--------|
| **Engine** | Redis (in-memory with optional persistence, depending on server config) |
| **Python client** | **`redis.asyncio`** — `redis.from_url()` (`deltalabs-backend/app/infra/redis_client.py`) |
| **Decoding** | `encoding="utf-8"`, `decode_responses=True` — command results that are Redis strings become Python `str` |
| **Startup / shutdown** | `connect_redis()` on startup; `disconnect_redis()` (`aclose`) runs **before** Mongo disconnect on app shutdown |

**Environment variables (Redis):**

| Variable | Default | Purpose |
|----------|---------|---------|
| `REDIS_URL` | `redis://localhost:6379/0` | URL including host, port, optional password (`redis://:pass@host:6379/0`), and **DB index** (`/0`) |
| `REDIS_MAX_CONNECTIONS` | `50` | Async connection pool size |

### Other settings that touch “data” paths (Redis-backed)

Configured on the same `Settings` object; full list in `config.py`. Examples:

| Variable | Role |
|----------|------|
| `IDEMPOTENCY_HEADER_NAME`, `IDEMPOTENCY_TTL_SECONDS` | Header for idempotency keys and Redis record lifetime |
| `FEED_ENGAGEMENT_STREAM_KEY`, `FEED_ENGAGEMENT_STREAM_MAXLEN` | Primary Redis Stream for feed worker input |
| `FEED_ENGAGEMENT_DEAD_LETTER_STREAM_KEY`, `…_MAXLEN` | Failed events stream |
| `FEED_ENGAGEMENT_PUBSUB_CHANNEL_PREFIX` | Pub/Sub prefix for clip channels |
| `RATE_LIMIT_*`, `TRUST_X_FORWARDED_FOR` | Rate limit storage uses Redis where implemented |

See [Redis usage](#redis-usage) for key naming by feature, not for connection strings.

---

## MongoDB collections

| Collection | Domain | Purpose |
|------------|--------|---------|
| `users` | Identity | User accounts |
| `user_sessions` | Identity | API sessions (hashed tokens, expiry) |
| `orgs` | Authorization | Organizations / tenants |
| `org_memberships` | Authorization | User membership in an org |
| `role_definitions` | Authorization | Role metadata and permission lists |
| `role_bindings` | Authorization | Scoped role assignments |
| `relationships` | Authorization | User-to-user relations within an org |
| `schools` | School | School records |
| `school_workspace_items` | School | Workspace tree (departments, classes, etc.) |
| `school_marketplace` | School | Marketplace listings |
| `school_offers` | School | Offers, bids, transfer negotiations |
| `school_memberships` | School | User membership in a school + school roles |
| `content_items` | Content / Media | Feed items |
| `content_likes` | Engagement | Like rows |
| `content_saves` | Engagement | Save / favorite rows |
| `content_comments` | Engagement | Comments |
| `content_shares` | Engagement | Share events |
| `content_events` | Engagement | Feed telemetry (e.g. watch time) |
| `media_assets` | Media | Upload and transcode pipeline metadata |
| `feature_catalog` | Library | Feature flags and catalog entries |

---

## Collection field reference

Conventions: `_id` is typically a string UUID or a prefixed id (`school_`, `wsi_`, `mkt_`, `offer_`, `feat_`). Timestamps are usually UTC `datetime`. Optional fields may be omitted or `null`.

### `users`

Canonical shape matches `UserRecord` in `app/domain/identity/schemas.py` and inserts in `identity/repository.py`.

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | User id (UUID) |
| `username` | string | Display / login |
| `username_normalized` | string | Lowercased; unique index |
| `email` | string \| null | |
| `email_normalized` | string \| null | Unique partial index when string |
| `phone_e164` | string \| null | Unique partial index when string |
| `is_active` | bool | Default true |
| `is_verified` | bool | Default false |
| `created_at`, `updated_at` | datetime | |
| `password_hash` | string | |

### `user_sessions`

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | Session id |
| `user_id` | string | |
| `token_hash` | string | Unique index |
| `created_at`, `expires_at` | datetime | TTL index on `expires_at` (expire after 0) |
| `revoked_at` | datetime \| null | |

### `orgs`

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | Org id |
| `slug` | string | Unique |
| `name` | string | |
| `is_active` | bool | |
| `created_at`, `updated_at` | datetime | |

### `org_memberships`

| Field | Type | Notes |
|-------|------|--------|
| `org_id`, `user_id` | string | Composite uniqueness |
| `status` | string | e.g. `active` |
| `created_at`, `updated_at` | datetime | Upsert via `$setOnInsert` / `$set` |

### `role_definitions`

| Field | Type | Notes |
|-------|------|--------|
| `role_key` | string | Unique |
| `title` | string | |
| `permissions` | string[] | |
| `description` | string \| null | |
| `membership_state` | string | |
| `membership_rank` | int | |
| `created_at`, `updated_at` | datetime | |

### `role_bindings`

| Field | Type | Notes |
|-------|------|--------|
| `org_id` | string | |
| `subject_user_id` | string | User receiving the role |
| `role_key` | string | |
| `scope_type` | string | e.g. `org`, school-scoped values from authz layer |
| `scope_id` | string | |
| `created_at`, `updated_at` | datetime | |

### `relationships`

| Field | Type | Notes |
|-------|------|--------|
| `org_id` | string | |
| `relation` | string | |
| `from_user_id`, `to_user_id` | string | Unique tuple with org + relation |

### `schools`

Written by `SchoolRepository.create_school` (`school/repository.py`).

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | Prefix `school_` + hex |
| `org_id` | string | |
| `name`, `slug`, `school_type` | string | |
| `email` | string \| null | Normalized lower |
| `logo_url` | string \| null | |
| `custom_fields` | `{ key, value }[]` | |
| `onboarding_status` | string | e.g. `active`, `pending_partner_acceptance` |
| `partners`, `documents` | array | Structured per API / schema |
| `created_by_user_id` | string | |
| `archived` | bool | |
| `created_at`, `updated_at` | datetime | |

### `school_workspace_items`

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | Prefix `wsi_` |
| `org_id`, `school_id` | string | |
| `parent_id` | string \| null | |
| `type` | string | folder, department, class, course, etc. |
| `title` | string | |
| `description` | string \| null | |
| `metadata` | object | |
| `is_root` | bool | One root per school (partial unique index) |
| `created_at`, `updated_at` | datetime | |

### `school_marketplace`

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | Prefix `mkt_` |
| `org_id`, `school_id`, `school_name`, `school_type` | string | |
| `owner_user_id`, `bidder_user_id` | string \| null | |
| `status` | string | e.g. `active`, `under_offer`, `sold`, `withdrawn` |
| `title`, `description` | string | |
| `price` | number | |
| `currency` | string | Uppercased |
| `created_at` | datetime | `updated_at` on updates |

### `school_offers`

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | Prefix `offer_` |
| `org_id`, `school_id`, `school_name` | string | |
| `status` | string | requested, approved, amendment, rejected, … |
| `negotiation_turn` | string | e.g. `sender`, `recipient` |
| `requested_at`, `updated_at` | datetime | |
| `sender_user_id`, `sender_email` | string \| null | |
| `recipient_email` | string \| null | |
| `party_full_name`, `party_email` | string \| null | |
| `ownership_percentage` | number \| null | |
| `share_accesses` | array \| null | |
| `listing_id` | string \| null | Marketplace link |
| `offered_price`, `offered_currency` | number / string \| null | |
| `note` | string \| null | |
| `offer_kind` | string \| null | e.g. `marketplace_transfer` |
| `amendment_rounds` | int | Set for marketplace transfer |
| `expires_at` | datetime \| null | |
| `shortlisted` | bool | Marketplace shortlist |
| `amendment_data` | object \| null | |

### `school_memberships`

Upserted by `user_id` + `school_id` (`upsert_school_membership`).

| Field | Type | Notes |
|-------|------|--------|
| `user_id`, `school_id` | string | Logical key |
| `org_id` | string | |
| `role_keys` | string[] | e.g. `school_owner` |
| `status` | string | `active`, `inactive` |
| `created_at`, `updated_at` | datetime | |

### `content_items`

Public feed and media-published items. Demo seed in `content/repository.py`; public projection in `content/schemas.py` (`FeedItemPublic`).

Typical fields: `_id`, `visibility`, `content_type`, `created_at`, `updated_at`, `video_src`, `media_tone`, `caption`, `hashtags`, `pdf_label`, optional denormalized counters such as `like_count`.

### `content_likes` / `content_saves`

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | UUID |
| `content_id`, `user_id` | string | Unique compound index |

### `content_comments`

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | |
| `content_id`, `user_id` | string | |
| `body` | string | |
| `created_at` | datetime | |

### `content_shares`

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | |
| `content_id`, `user_id` | string | |
| `created_at` | datetime | |

### `content_events`

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | |
| `content_id`, `user_id` | string | |
| `event` | string | |
| `watch_ms`, `position_ms` | int \| null | |
| `created_at` | datetime | |

### `media_assets`

Created on upload intent in `media/service.py`.

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | Media id |
| `org_id`, `owner_user_id` | string | |
| `source_filename`, `source_content_type` | string | |
| `file_size_bytes` | int | |
| `caption` | string | |
| `hashtags` | string[] | |
| `visibility` | string | |
| `publish_to_feed` | bool | |
| `status` | string | e.g. `upload_pending`, … |
| `upload_object_key`, `upload_url_fallback` | string | |
| `hls_url`, `poster_url` | string \| null | |
| `duration_seconds` | number \| null | |
| `renditions` | array | |
| `created_at`, `updated_at` | datetime | |

### `feature_catalog`

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | `feat_{feature_key}` |
| `feature_key` | string | Unique |
| `title`, `description` | string | |
| `enabled`, `beta` | bool | |
| `sort_order` | int | |
| `route_path` | string | |
| `capability_requirements` | object | Serialized capability model |
| `created_at`, `updated_at` | datetime | |

---

## MongoDB indexes

Indexes are created at runtime by each domain repository’s `ensure_indexes()` (there is no checked-in migration script). Application startup or tests call these methods so indexes converge to the definitions below. **Unique** indexes enforce identity and prevent duplicate bindings; **compound** indexes match the sort fields used in list queries; **partial** indexes apply only when a filter matches; **TTL** indexes ask the server to delete documents after a datetime threshold.

### How to read this section

- **Keys** list field order and sort direction (`1` = ascending, `-1` = descending).
- **Source file** is the single place to verify names if code and this doc drift.

### Identity — `deltalabs-backend/app/domain/identity/repository.py`

| Collection | Index name (or Mongo default) | Keys | Unique | TTL / partial | Role |
|------------|------------------------------|------|--------|---------------|------|
| `users` | `username_normalized_1` | `username_normalized` ↑ | yes | — | Fast login lookup; one account per normalized username |
| `users` | `email_normalized_1` | `email_normalized` ↑ | yes | only if value is BSON string | Optional emails remain sparse; avoids duplicate addresses |
| `users` | `phone_e164_1` | `phone_e164` ↑ | yes | only if value is BSON string | Same pattern for optional phone |
| `user_sessions` | (default) | `token_hash` ↑ | yes | — | Resolve session by presented token hash |
| `user_sessions` | (default) | `expires_at` ↑ | no | **TTL** `expireAfterSeconds=0` | Mongo removes the document when `expires_at` is in the past |

### Authorization — `app/domain/authorization/repository.py`

| Collection | Index name | Keys | Unique | Notes |
|------------|------------|------|--------|--------|
| `orgs` | (default) | `slug` ↑ | yes | Org slug is the tenant-facing identifier |
| `org_memberships` | `uq_org_membership` | `org_id`, `user_id` | yes | One membership row per user per org |
| `org_memberships` | `ix_org_membership_status` | `org_id`, `status` | no | Filters like “all active members in org” |
| `role_definitions` | `uq_role_definition` | `role_key` | yes | Catalog row is keyed by stable `role_key` |
| `role_bindings` | `uq_role_binding` | `org_id`, `subject_user_id`, `scope_type`, `scope_id`, `role_key` | yes | Same role cannot be bound twice for the same scope |
| `role_bindings` | `ix_role_binding_lookup` | `org_id`, `subject_user_id`, `scope_type`, `scope_id` | no | Loads all roles for a user in a scope (used with `$or` across resolved scopes) |
| `relationships` | `uq_relationship` | `org_id`, `relation`, `from_user_id`, `to_user_id` | yes | One edge per tuple (parent/mentor/guardian links) |

### School — `app/domain/school/repository.py`

| Collection | Index name | Keys | Unique | Partial | Notes |
|------------|------------|------|--------|---------|--------|
| `schools` | `ix_schools_org_archived_name` | `org_id`, `archived`, `name` | no | — | Listing schools within an org by archive bucket and name |
| `schools` | `uq_schools_org_slug` | `org_id`, `slug` | yes | — | Slug unique per org, not globally |
| `school_marketplace` | `ix_school_marketplace_org_created` | `org_id`, `created_at` | no | — | Time-ordered marketplace queries per tenant |
| `school_offers` | `ix_school_offers_org_status_updated` | `org_id`, `status`, `updated_at` | no | — | Inbox / pipeline views by status and recency |
| `school_memberships` | `uq_school_memberships_user_school` | `user_id`, `school_id` | yes | — | One membership document per user per school |
| `school_memberships` | `ix_school_memberships_school` | `school_id` | no | — | Enumerate members of a school |
| `school_workspace_items` | `ix_school_workspace_items_org_school_type_created` | `org_id`, `school_id`, `type`, `created_at` | no | — | Tree / listing queries scoped to a school |
| `school_workspace_items` | `uq_school_workspace_items_single_root` | `org_id`, `school_id`, `is_root` | yes | `is_root: true` | At most one root folder item per school |

### Content — `app/domain/content/repository.py`

| Collection | Index name | Keys | Notes |
|------------|------------|------|--------|
| `content_items` | `ix_content_items_visibility_created_id` | `visibility` ↑, `created_at` ↓, `_id` ↓ | Matches public feed pagination (cursor uses `created_at` + `_id`) |
| `content_items` | `ix_content_items_type_created` | `content_type` ↑, `created_at` ↓ | Filtered feeds by content type |

### Engagement — `app/domain/engagement/repository.py`

| Collection | Index name | Keys | Unique | Notes |
|------------|------------|------|--------|--------|
| `content_likes` | `uq_content_likes_content_user` | `content_id`, `user_id` | yes | One like row per user per item |
| `content_saves` | `uq_content_saves_content_user` | `content_id`, `user_id` | yes | Same for saves |
| `content_comments` | `ix_content_comments_content_created` | `content_id`, `created_at` | no | Thread comments in posting order |
| `content_shares` | `ix_content_shares_content_created` | `content_id`, `created_at` | no | Share history per item |
| `content_events` | `ix_content_events_user_created` | `user_id`, `created_at` | no | Per-user telemetry timelines |
| `content_events` | `ix_content_events_content_event_created` | `content_id`, `event`, `created_at` | no | Analytics grouped by item and event type |

### Media — `app/domain/media/repository.py`

| Collection | Index name | Keys | Notes |
|------------|------------|------|--------|
| `media_assets` | `ix_media_assets_org_created` | `org_id`, `created_at` ↓ | Tenant media library ordering |
| `media_assets` | `ix_media_assets_owner_created` | `owner_user_id`, `created_at` ↓ | User-owned assets |
| `media_assets` | `ix_media_assets_status_updated` | `status`, `updated_at` ↓ | Pipeline / ops dashboards by processing state |

### Library — `app/domain/library/repository.py`

| Collection | Index name | Keys | Unique | Notes |
|------------|------------|------|--------|--------|
| `feature_catalog` | `uq_feature_catalog_feature_key` | `feature_key` | yes | Stable feature id |
| `feature_catalog` | `ix_feature_catalog_enabled_sort` | `enabled`, `sort_order` | no | Matches `list_enabled_features` sort |

### Index gaps and growth collections

There is **no TTL** on engagement, content, marketplace, or media collections. High-volume telemetry (`content_events`) and comments/shares will grow with usage unless you add archival jobs or TTL/partial strategies later. Adding an index always trades write cost and disk for read latency; follow query patterns in the corresponding `repository.py` before inventing new indexes.

---

## RBAC role catalog

Authorization is **tenant-scoped**: every decision is tied to an `org_id`, an active `org_memberships` row, and then roles and permissions resolved from Mongo (plus one relationship-based exception below).

### Storage model (three layers)

| Layer | Collection | Responsibility |
|-------|------------|------------------|
| Catalog | `role_definitions` | Defines each `role_key`: human `title`, optional `description`, `permissions[]`, and UI/ranking hints `membership_state`, `membership_rank` |
| Assignment | `role_bindings` | Grants a `role_key` to `subject_user_id` within `org_id` for a scope `(scope_type, scope_id)` |
| School membership | `school_memberships` | Per-user-per-school row with `role_keys[]` (e.g. `school_owner`) for school product flows; **not** the same document type as `role_bindings` |

`ScopeType` in code is `org` \| `school` \| `lab` \| `course` \| `global` (`authorization/schemas.py`). Bindings store whatever scope the app assigned when the binding was written.

### How `authorize()` uses the catalog

1. **Org membership gate** — `find_membership` requires `status: "active"`. No membership ⇒ deny with reason `missing_org_membership`.
2. **Scope chain** — `_scope_resolution_chain` builds scope pairs checked for bindings. For non-`org` scopes it queries both the requested scope (e.g. school id) and the parent org scope `(org, org_id)`, so org-wide roles still apply when checking school-scoped permissions.
3. **Effective permissions** — Union of all `permissions` arrays from every `role_definition` whose `role_key` appears in the user’s bindings for those scopes. Literal permission match **or** catalog entry containing `"*"` grants allow (`org_owner`).
4. **Relationship exception** — For permission `student:read_progress` with `resource_owner_user_id` set, allow if `relationships` contains `parent_of`, `guardian_of`, or `mentor_of` from the caller to that student (even when the parent role’s permissions alone would not cover the call).

`get_access_profile` uses the same definition merge to expose `role_keys`, flattened `permissions`, and a single `membership_state` chosen by highest `membership_rank` across bound roles (for feature gating and UI).

### Bootstrap and mutability

`AuthorizationService.bootstrap_defaults` ensures indexes, a default org (from settings), and **upserts** every row in `_DEFAULT_ROLES` in `authorization/service.py` into `role_definitions`. New environments get a full catalog without a separate migration file. Changing default permissions in code updates Mongo on next bootstrap; production should treat catalog edits as intentional releases.

### Default `role_key` values (seed)

`system_admin`, `org_owner`, `org_admin`, `finance_admin`, `school_admin`, `teacher`, `student`, `parent`, `lab_manager`, `lab_assistant`, `lab_member`. Exact permission strings live only in code and persisted documents — **always** read `_DEFAULT_ROLES` and `upsert_role_definition` for the authoritative list.

### School `role_keys` vs org RBAC

`school_owner` is written on `school_memberships` by the school domain; it is **not** part of `_DEFAULT_ROLES`. School APIs use membership + school logic; org-level `require_permission` / `authorize` use `role_bindings` + `role_definitions`. Product features that need one model to imply the other must bridge explicitly in application code.

### Related types

- `PermissionCheckRequest` — `org_id`, `permission`, `scope_type`, `scope_id`, optional `resource_owner_user_id`.
- `relationships` — social graph edges used for the student-progress exception, not for generic RBAC.

---

## Data lifecycle and retention

Lifecycle here means **how long data exists**, **how it is invalidated**, and **what is automatic vs operational**.

### Automatic expiration (MongoDB TTL)

| Collection | Field | Mechanism | Behavior |
|------------|-------|-----------|----------|
| `user_sessions` | `expires_at` | TTL index `expireAfterSeconds=0` | Document deleted once `expires_at` ≤ current time (Mongo background thread). Independent of `revoked_at`. |

TTL does **not** run on a wall-clock schedule you control; expect eventual removal shortly after expiry.

### Session and credential lifecycle (non-TTL)

| Mechanism | Collection / store | Meaning |
|-----------|---------------------|--------|
| Revocation | `user_sessions.revoked_at` | Application should reject tokens when set; row may remain until TTL removes it |
| Unique token | `user_sessions.token_hash` | New session ⇒ new row; old tokens become invalid when replaced or revoked |

### Business time bounds (application-enforced)

| Area | Fields | Notes |
|------|--------|--------|
| Offers | `school_offers.expires_at` | Business cutoff; not a Mongo TTL — workers or API must enforce status transitions |
| Offers / negotiation | `requested_at`, `updated_at`, `status` | Workflow progression; documents typically retained for audit unless you add purge jobs |

### Archival and soft states

| Pattern | Where | Effect |
|---------|--------|--------|
| Archived tenant | `schools.archived` | School still stored; `list_schools` filters by `archived`; index supports org + archived + name |
| Inactive membership | `school_memberships.status` | `inactive` vs `active` without deleting the row |
| Suspended / invited org member | `org_memberships.status` | `authorize` only loads `active` |
| Org / user flags | `orgs.is_active`, `users.is_active` | Deactivation patterns for accounts and tenants |

There is **no** generic `deleted_at` soft-delete column across all collections; lifecycle is per domain.

### Audit and ordering timestamps

`created_at` / `updated_at` (and offer `requested_at`) support sorting, support tooling, and future retention policies. They do not by themselves delete anything.

### High-growth and Redis (operational retention)

| Kind | Location | Lifecycle |
|------|----------|-----------|
| Feed telemetry | `content_events` | Indexed by user and by content; no TTL — plan aggregation or pruning if volume matters |
| Ephemeral flows | Redis signup / OTP / recovery | Keys expire per service TTL |
| Idempotency | Redis | `idempotency_ttl_seconds` in config |
| Streams | Redis feed worker | Stream trimming / DLQ policy is configuration and ops concern |

### Formal retention policies

There is **no** central `retention_policies` collection. If you need compliance-driven deletion (e.g. “erase events after 90 days”), implement **scheduled jobs** that delete or archive by `created_at`, and optionally add per-org metadata fields or a small policy document collection later.

---

## Operational notes

Operational context is any text that helps humans (support, finance, school admins) understand a record without changing the core domain schema.

### In Mongo today

| Location | Field | Typical use |
|----------|-------|-------------|
| `school_offers` | `note` | Free-text on a specific offer / negotiation |
| Listings, workspace, media, features | `description` (and similar) | User- or admin-facing copy, not necessarily internal-only |

### Limits of single-field notes

A single `note` field is overwritten on update and carries no author or history. For **audit trails**, **support threads**, or **multiple contributors**, prefer append-only rows.

### Optional pattern (not implemented)

An `operational_notes` collection: `entity_type`, `entity_id`, optional `org_id`, `body`, `created_by_user_id`, `created_at`, optional `visibility` or `tags`. Each insert is immutable; queries use `entity_*` plus a time index. Add only if product requirements exceed what `note` + logging can provide.

---

## Redis usage

Redis is not a document store; keys depend on features. Examples:

| Area | Pattern / keys | Code reference |
|------|----------------|----------------|
| Signup multi-step flow | `signup:flow:{flow_id}` | `identity/signup_flow_service.py` |
| OTP verification | Verification id keys | `identity/verification_service.py` |
| Account recovery | Recover id keys | `identity/recover_service.py` |
| Idempotency | Configurable TTL | `core/idempotency.py`, `idempotency_ttl_seconds` in config |
| Feed worker | Streams (defaults `feed:engagement:events`, `feed:engagement:dead_letter`), pub/sub `feed:clip:*`, worker cursor keys | `core/config.py`, `jobs/workers.py`, `engagement/queue.py` |
| Rate limiting | Per-IP / feature keys | `core/rate_limit.py` and related |

Stream key names and TTLs are configurable via `deltalabs-backend/app/core/config.py`.

---

## Related documentation

- `docs/school-marketplace-offers-implementation-details.md` — marketplace behavior
- `deltalabs-frontend/docs/school-tenant-architecture.md` — frontend tenant view

---

*Generated from the `deltalabs-backend` codebase. If repositories add collections or fields, update this file or regenerate from those sources.*
