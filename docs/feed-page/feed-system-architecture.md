# Feed — System architecture (Web + Backend)

## Purpose

This document describes the **system-level** Feed architecture: how the public web client, backend API, data stores, and realtime layer work together for video/audio discovery, engagement, and personalization.

**Scope:** `deltalabs-frontend` + `deltalabs-backend` only.

---

## Architecture style (what we use)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **API** | REST (`/v1/feed`, `/v1/search`) + WebSocket (`/v1/feed/ws`) | Simple caching for reads; WS for live count updates on the landing feed |
| **Backend** | FastAPI + domain services (`content`, `engagement`, `media`) | Clear boundary: read/rank in content; writes in engagement |
| **Primary store** | MongoDB | Durable feed items, engagement, telemetry |
| **Ephemeral / async** | Redis | Idempotency cache, engagement stream, Pub/Sub fanout, worker cursor |
| **Frontend** | Next.js App Router + TanStack Query + minimal Redux | Server components for routes; client state for active clip, counts, comment panel |
| **Auth on feed** | Optional bearer on read; required on writes | Anonymous users browse; personalization and engagement need session |
| **Media** | Object storage + ingest callback → `content_items` | No video blobs in Mongo; playback URLs on feed documents |

---

## High-level system diagram

```mermaid
flowchart TB
  subgraph Client["Web client (untrusted)"]
    Routes["Next.js routes<br/>/ · /audio · /search · /feed/filter · …"]
    Views["Feed views<br/>LandingPageView, AudioExplorerView, …"]
    RQ["TanStack Query<br/>useFeedClips, mutations"]
    APIClient["apiClient.ts<br/>Bearer when session exists"]
    LS["localStorage<br/>dl.auth.session.v1"]
    WSClient["WebSocket<br/>/v1/feed/ws"]
    RDX["Redux feedUiSlice<br/>commentPanelOpen only"]
  end

  subgraph Edge["Routing / shell"]
    PublicLayout["(public)/layout.tsx<br/>PublicLayoutShell + TopNav"]
  end

  subgraph API["Backend API (trusted boundary)"]
    FeedHTTP["/v1/feed/*<br/>list, item, engagement, telemetry"]
    SearchHTTP["/v1/search/*<br/>global search"]
    FeedWS["WS /v1/feed/ws"]
    MediaHTTP["/v1/orgs/.../media/upload-intent<br/>/v1/media/ingest/callback"]
  end

  subgraph Domain["Domain services"]
    ContentSvc["content.service.ContentService<br/>list_feed, personalize, cursor"]
    EngagementSvc["engagement.service.EngagementService<br/>like, save, comment, share, event"]
    MediaSvc["media.service.MediaService<br/>ingest → upsert feed item"]
  end

  subgraph Stores["Data stores"]
    Mongo[(MongoDB<br/>content_items, engagement, events)]
    Redis[(Redis<br/>idempotency, streams, pubsub)]
    ObjectStore[(Object storage<br/>S3/R2 — video/audio blobs)]
  end

  Routes --> PublicLayout --> Views
  Views --> RQ --> APIClient
  Views --> WSClient
  Views --> RDX
  APIClient --> FeedHTTP
  APIClient --> SearchHTTP
  APIClient -. "session token" .-> LS
  WSClient --> FeedWS

  FeedHTTP --> ContentSvc
  FeedHTTP --> EngagementSvc
  MediaHTTP --> MediaSvc

  ContentSvc --> Mongo
  EngagementSvc --> Mongo
  EngagementSvc --> Redis
  MediaSvc --> Mongo
  MediaSvc --> ObjectStore

  EngagementSvc -->|publish + stream| Redis
  FeedWS -->|PSUBSCRIBE feed:clip:*| Redis
  MediaSvc -->|ready + publish_to_feed| Mongo
```

---

## Read path: load feed page

```mermaid
sequenceDiagram
  participant U as User browser
  participant V as LandingPageView
  participant Q as useFeedClips
  participant C as apiClient
  participant F as GET /v1/feed
  participant CS as ContentService
  participant M as MongoDB

  U->>V: Open /
  V->>Q: fetch clips (limit, content_type=video)
  Q->>C: GET /v1/feed
  C->>F: Authorization optional
  F->>CS: list_feed(user_id?)
  CS->>M: list_public_items + exclusions
  CS->>CS: _personalize_docs (if authed)
  CS->>M: engagement aggregates
  M-->>CS: page of items
  CS-->>F: items, next_cursor, has_more
  F-->>V: FeedPaginatedResponse
  V->>V: IntersectionObserver → active clip
  V->>V: preload ±4 videos
```

---

## Write path: like (representative engagement)

```mermaid
sequenceDiagram
  participant U as User
  participant V as LandingPageView
  participant M as useFeedLikeMutation
  participant C as apiClient
  participant F as POST /v1/feed/{id}/like
  participant ES as EngagementService
  participant R as Redis
  participant DB as MongoDB
  participant WS as Pub/Sub + WS clients

  U->>V: Tap like (authenticated)
  V->>V: Optimistic UI update
  V->>M: mutate(clipId)
  M->>C: POST + Idempotency-Key
  C->>F: Bearer required
  F->>ES: toggle like
  ES->>R: replay_or_execute (idempotency)
  ES->>DB: content_likes upsert/delete
  ES->>R: XADD stream + PUBLISH feed:clip:{id}
  F-->>V: counts + liked_by_me
  V->>V: Reconcile optimistic state
  R-->>WS: like_toggled payload
  WS-->>V: Update counts for other tabs/users
```

---

## Content ingestion → feed (school uploads)

```mermaid
flowchart LR
  Admin["Org admin / uploader"] --> Intent["POST /v1/orgs/{org_id}/media/upload-intent"]
  Intent --> Asset["media_assets<br/>status=upload_pending"]
  Asset --> Upload["Client uploads to presigned URL"]
  Upload --> Transcode["Transcoder / worker<br/>(external)"]
  Transcode --> Callback["POST /v1/media/ingest/callback<br/>X-Ingest-Secret"]
  Callback --> Ready{status == ready<br/>AND publish_to_feed<br/>AND visibility public?}
  Ready -- yes --> Item["upsert content_items<br/>_id = media_id"]
  Ready -- no --> Asset
  Item --> Feed["GET /v1/feed serves item"]
```

---

## Frontend route map (public shell)

| Route | View | Feed API usage |
|-------|------|----------------|
| `/` | `LandingPageView` | Full FYP: clips, engagement, WS, telemetry |
| `/audio`, `/audio/library` | `AudioExplorerView` | `content_type=audio` list |
| `/audio/[id]` | `AudioDetailView` | `GET /v1/feed/{id}` |
| `/feed/filter` | `FilterResultsView` | Filtered `GET /v1/feed` from URL params |
| `/search` | `SearchResultsView` | `GET /v1/search` |
| `/explore`, `/ai`, `/simulation` | Hub shells | Mostly static UI (no feed list yet) |

TopNav category tabs link: Video → `/`, Audio → `/audio`, AI → `/ai`, Simulation → `/simulation`, All → `/explore`.

---

## Cross-cutting concerns

### Authentication

- **Read feed:** public; optional `Authorization: Bearer` enables personalization (exclude hidden/watched, rerank).
- **Write engagement / telemetry:** `401` without valid session.
- **WebSocket:** `access_token` query param validated against hashed session in Mongo.

### Resilience

- **Low inventory:** if hide/watched filters empty the page, backend re-lists without exclusions.
- **Cold start:** deterministic per-user shuffle when signal profile is weak.
- **Frontend offline:** mock local clips when `NEXT_PUBLIC_FEED_DEBUG_USE_LOCAL_VIDEOS_WHEN_EMPTY` and API empty (dev only).
- **Redis down:** idempotency/stream may degrade; HTTP writes still persist to Mongo; WS may be unavailable.

### Search vs feed

- **Feed list:** cursor pagination on `content_items`, optional filters (`hashtag`, `course_category`, duration, `content_type`).
- **Search:** separate `/v1/search` endpoint; shares filter navigation to `/feed/filter` on the web.

---

## Implemented vs not implemented (accuracy)

| Area | Status |
|------|--------|
| Video landing feed + engagement | Implemented |
| Audio list + detail | Implemented (list + single item) |
| Cursor pagination in landing UI | **Not wired** (first page only) |
| `POST …/enroll` | Backend placeholder; **no UI** |
| AI / Simulation / Explore hubs | **Shell UI** only |
| Go to Course rail action | **UI only** |
| Report content | **UI only** |
| ML ranking model | **Not implemented** (weighted heuristic today) |

---

## Walkthrough (one session)

1. User opens `/` — `PublicLayoutShell` renders TopNav + `LandingPageView`.
2. `useFeedClips` calls `GET /v1/feed`; backend returns public videos, personalized if logged in.
3. User scrolls snap-feed; `IntersectionObserver` sets active clip; `FeedMedia` emits `view_start` / `view_complete` / `skip` when authenticated.
4. User likes a clip — optimistic UI, `POST /v1/feed/{id}/like`, Redis idempotency, Mongo toggle, Pub/Sub updates WS subscribers.
5. User opens comments — Redux opens panel; `GET/POST` comments; realtime may bump count via WS.
6. User searches from left rail — navigates to `/search?q=…` or applies filters → `/feed/filter?…&fp=1`.
7. School uploads video — ingest callback upserts `content_items`; item appears on next feed read.
