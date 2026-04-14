# Feed / FYP — implementation analysis & completed-work task list

**Purpose:** Deep analysis of the **Feed (For You Page)** vertical in **Deltalabs** (`deltalabs-backend` + `deltalabs-frontend`), structured as **tasks and subtasks** you can submit as “work completed.”  
**Scope:** What is **implemented in code today** (not a future roadmap). Gaps are called out explicitly under **Not wired / not implemented**.

---

## 1. Executive summary

| Layer | Summary |
|--------|---------|
| **Backend** | Full `/v1/feed` REST surface: paginated list with optional auth for personalization, single item, like/save/share/comment/event/enroll, public comments list, telemetry summary, authenticated WebSocket for realtime clip updates, worker health. Engagement writes use **Redis idempotency**; post-write **stream enqueue** + **Pub/Sub** for realtime. Content service implements **FYP-style personalization** (signals from telemetry + engagement, rerank, cold-start shuffle). |
| **Frontend** | **Landing** loads the feed via TanStack Query, maps server clips to the existing UI model, sends **telemetry** and **engagements** when authenticated, **optimistic UI** for like/save/share and comments, **WebSocket** sync for counts, **comment sidebar** with real API + portal layout, loading/error/empty states, optional **debug** panels (local videos when empty, artificial delay, worker health). |
| **Gaps** | No **cursor pagination** in the UI (first page only). **`fetchFeedItem`**, **`postFeedEnroll`**, **`fetchFeedTelemetrySummary`** exist in the FE API module but **no hooks/views** consume them. **Feed “hub” routes** (simulation, AI, audio, explore-all) are mostly **shell/layout**, not distinct data integrations. **Go to Course** rail action is not wired to enrollment/navigation. |

---

## 2. Backend — detailed inventory

**Primary files:** `deltalabs-backend/app/api/v1/feed.py`, `app/domain/content/service.py`, `app/domain/content/repository.py`, `app/domain/content/schemas.py`, `app/domain/engagement/service.py`, `app/domain/engagement/repository.py`, `app/domain/engagement/schemas.py`, `app/domain/engagement/queue.py`, workers / health via `app/jobs/workers.py`.

### Epic B1 — HTTP API (`/v1/feed`)

| Task | Subtasks (completed) |
|------|----------------------|
| **B1.1 List feed** | `GET /v1/feed` with `limit` (1–50, default 12), `cursor`, optional `content_type`; optional **`get_current_user_optional`** so authenticated users get personalized ordering; returns `FeedPaginatedResponse` (`items`, `total`, `next_cursor`, `has_more`). |
| **B1.2 Single item** | `GET /v1/feed/{item_id}` → `FeedItemPublic` or 404. |
| **B1.3 Like** | `POST /v1/feed/{item_id}/like` — auth required; toggle like; **`Idempotency-Key`** header; response `EngagementWriteResponse`; enqueue stream + publish Pub/Sub. |
| **B1.4 Save (bookmark)** | `POST /v1/feed/{item_id}/save` — same pattern as like. |
| **B1.5 Share** | `POST /v1/feed/{item_id}/share` — record share; idempotency; stream + Pub/Sub. |
| **B1.6 Comment create** | `POST /v1/feed/{item_id}/comment` with body; idempotency scoped by body hash; stream + Pub/Sub. |
| **B1.7 Comments list** | `GET /v1/feed/{item_id}/comments` — public; `limit` 1–200; resolves **display names** for commenters. |
| **B1.8 Telemetry event** | `POST /v1/feed/{item_id}/event` — `view_start`, `view_complete`, `skip`, `hide` + optional `watch_ms` / `position_ms`; idempotency; stream + Pub/Sub. |
| **B1.9 Enroll placeholder** | `POST /v1/feed/{item_id}/enroll` — auth required; stable placeholder until real course enrollment exists. |
| **B1.10 Telemetry summary** | `GET /v1/feed/telemetry/summary` — aggregates for observability (`eventCounts`, rates, averages). |
| **B1.11 Worker health** | `GET /v1/feed/worker/health` — auth required; Redis stream / DLQ / lag snapshot; **503** if Redis unavailable. |

### Epic B2 — FYP / ranking logic (content service)

| Task | Subtasks (completed) |
|------|----------------------|
| **B2.1 Cursor codec** | Encode/decode feed cursor; invalid cursor → validation error (`feed_cursor_invalid`). |
| **B2.2 Public listing** | Repository-backed `list_public_items` with cursor + optional `content_type` + optional **exclude_content_ids**. |
| **B2.3 Empty personalization fallback** | If exclusion removes all items, **retry list without exclusions** so feed never goes blank solely due to hides/watched filters. |
| **B2.4 Engagement snapshot on read** | For listed (and single) items: attach **like/save/comment/share counts** and **`liked_by_me` / `saved_by_me`** when `user_id` present. |
| **B2.5 Signal profile** | From recent engagement + telemetry: **hashtag weights**, **event boosts**, **hidden ids**, **watched ids**. |
| **B2.6 Personalization rerank** | Score window: recency + hashtag affinity + event boosts + deterministic jitter; sort; fallback to **stable per-user shuffle** if weak signals or too few ranked docs. |
| **B2.7 Cold start** | Users with no strong signals get **deterministic shuffle** seeded by `user_id` + cursor. |
| **B2.8 Indexes** | `bootstrap_indexes` on content paths for feed read performance. |

### Epic B3 — Engagement domain

| Task | Subtasks (completed) |
|------|----------------------|
| **B3.1 Like/save toggles** | Mongo persistence; counts; assert public content exists. |
| **B3.2 Comments** | Append comment; list with user display names. |
| **B3.3 Shares** | Increment / aggregate share count. |
| **B3.4 Telemetry persistence** | Store feed events for ranking + summary. |
| **B3.5 Idempotent writes** | `replay_or_execute` per action scope + TTL (Redis). |
| **B3.6 Indexes** | Engagement repository index bootstrap. |

### Epic B4 — Async / realtime pipeline

| Task | Subtasks (completed) |
|------|----------------------|
| **B4.1 Redis stream enqueue** | `enqueue_feed_engagement_event` — best-effort `XADD` with maxlen (errors logged, non-fatal). |
| **B4.2 Pub/Sub clip updates** | `publish_feed_clip_update` per `content_id` channel — for WebSocket fanout. |
| **B4.3 Dead letter helper** | `enqueue_feed_dead_letter_event` for failed worker processing (stream). |
| **B4.4 WebSocket** | `WS /v1/feed/ws` — query `access_token` (session hash lookup), optional `clip_ids` (max 100, must exist publicly); `PSUBSCRIBE` engagement channel pattern; filter messages by subscribed clips; graceful handling when Redis missing/fails. |

### Epic B5 — Tests (backend)

| Task | Subtasks (completed) |
|------|----------------------|
| **B5.1 HTTP smoke** | `tests/test_feed_http.py` — feed shape, item 404, like/event 401, comments shape + 404, telemetry summary shape. |
| **B5.2 Unit: cursor** | `tests/unit/test_feed_cursor.py`. |
| **B5.3 Unit: personalization** | `tests/unit/test_feed_personalization.py`. |
| **B5.4 Router registration** | Feed router included from `app/api/v1/__init__.py`. |

---

## 3. Frontend — detailed inventory

**API module:** `deltalabs-frontend/src/modules/Feed/api/index.ts`  
**Hooks:** `src/modules/Feed/hooks/useFeedQueries.ts`, `feedQueryKeys.ts`, `hooks/index.ts`  
**Main view:** `src/modules/Feed/views/LandingPageView.tsx`  
**Shell / layout:** `FeedExplorerShell.tsx`, `FeedLoadingState.tsx`, `FeedWorkerHealthDebugPanel.tsx`  
**Components:** `src/components/features/feed/**` (see component table below)  
**Data / presentation helpers:** `src/modules/Feed/data/*` (e.g. `mockVideoFeed`, `landingFeedPresenter`)

### Epic F1 — Feed API client (TypeScript)

| Task | Subtasks (completed) |
|------|----------------------|
| **F1.1 DTOs** | Types for paginated feed, events, engagement responses, share, comments, telemetry summary, worker health. |
| **F1.2 `fetchFeedPage`** | `GET /v1/feed` with `limit`, `cursor`, `content_type` (default `"video"`). |
| **F1.3 `postFeedEvent`** | `POST /v1/feed/{id}/event`; **no-op success** for local debug clip ids when debug env enabled. |
| **F1.4 `postFeedLike` / `postFeedSave` / `postFeedShare`** | POST with **`Idempotency-Key`**; local in-memory simulation for debug clips. |
| **F1.5 `fetchFeedComments` / `postFeedComment`** | GET/POST comments; local store for debug clips. |
| **F1.6 `fetchFeedItem`** | `GET /v1/feed/{id}` — **client ready** (see §5). |
| **F1.7 `postFeedEnroll`** | POST enroll — **client ready** (see §5). |
| **F1.8 `fetchFeedTelemetrySummary`** | GET summary — **client ready** (see §5). |
| **F1.9 `fetchFeedWorkerHealth`** | GET worker health for debug panel. |
| **F1.10 Debug: empty feed** | `NEXT_PUBLIC_FEED_DEBUG_USE_LOCAL_VIDEOS_WHEN_EMPTY` — inject `MOCK_VIDEO_FEED` with `local-feed-*` ids. |
| **F1.11 Debug: loading delay** | `NEXT_PUBLIC_FEED_DEBUG_LOADING_MS` — artificial delay in `fetchFeedClips`. |

### Epic F2 — React Query hooks

| Task | Subtasks (completed) |
|------|----------------------|
| **F2.1 `useFeedClips`** | Query key `feedQueryKeys.clips()`; `staleTime: Infinity`; uses `fetchFeedPage` + debug fallbacks. |
| **F2.2 `useFeedComments`** | Per-clip key; maps API rows to **preview** shape (initials, display name humanization); aggressive refetch (mount/focus/reconnect). |
| **F2.3 `useFeedEventMutation`** | Wraps `postFeedEvent`. |
| **F2.4 `useFeedLikeMutation` / `useFeedSaveMutation` / `useFeedShareMutation`** | One mutation per action. |
| **F2.5 `useFeedCommentMutation`** | Post comment by `itemId` + body. |
| **F2.6 `useFeedWorkerHealth`** | Poll every 2s when enabled. |
| **F2.7 Query keys** | Centralized in `feedQueryKeys.ts`. |

### Epic F3 — Landing page (`LandingPageView`)

| Task | Subtasks (completed) |
|------|----------------------|
| **F3.1 Feed load UX** | Pending → `FeedLoadingState` inside `FeedExplorerShell`; error → `FeedStatePanel` with offline-aware copy + refetch; empty → “No videos available” state. |
| **F3.2 Clip list state** | `useFeedClips` data; **filter hidden** clips locally (`hiddenClipIds`); if filter removes everything, **show full list again** (non-destructive UX). |
| **F3.3 Active clip detection** | `IntersectionObserver` on `[data-feed-slide]` to set `activeClipId`. |
| **F3.4 Keyboard navigation** | Arrow up/down on feed container scrolls between slides. |
| **F3.5 Telemetry wiring** | `FeedMedia` → `onFeedEvent`; **`hide`** always updates local hidden set; **authenticated** users send `view_start` / `view_complete` / `skip` / `hide` (+ watch/position) via mutation. |
| **F3.6 Like** | Optimistic count + active state; server reconciliation on success/error; **`Idempotency-Key`** from API layer; rail requires auth → `FeedAuthGateModal` or direct login query. |
| **F3.7 Save (bookmark)** | Same pattern as like. |
| **F3.8 Share** | Opens `FeedShareSheet`; on channel select, if authenticated, calls share mutation and reconciles **share count**. |
| **F3.9 Comment rail + sidebar** | Redux `commentPanelOpen`; portal sidebar `top-16` height calc; **`onCommentCreated`** updates **comment count** on rail. |
| **F3.10 Realtime sync** | `WebSocket` to `/v1/feed/ws` with `access_token` + `clip_ids`; applies `like_toggled`, `save_toggled`, `comment_created`, `shared` to local count/active state for current user where applicable. |
| **F3.11 Initial server flags** | `useEffect` seeds `likedByClip` / `savedByClip` from `clip.likedByMe` / `clip.savedByMe` when undefined locally. |
| **F3.12 Mute** | Global `isFeedMuted` across slides. |
| **F3.13 Preload** | Active index ±4 → `preloadStrategy: "auto"`, else `"metadata"`. |
| **F3.14 Debug worker panel** | `NEXT_PUBLIC_FEED_DEBUG_WORKER_HEALTH` + authenticated → `FeedWorkerHealthDebugPanel` in shell `rightAside`. |
| **F3.15 Auth flows from feed** | Query param `auth=login|signup` via router; `FeedAuthGateModal` actions. |

### Epic F4 — Feed UI components (design + behavior)

| Component (path) | Completed work (task framing) |
|------------------|----------------------------|
| `FeedViewport.tsx` | Composes `FeedMedia` + overlay children; passes `clipId`, `preloadStrategy`, `onFeedEvent`. |
| `FeedMedia.tsx` | Video/placeholder, play/pause, scrubbing, time badge, **telemetry** hooks (`view_start`, `view_complete`, `skip`, `hide`), watch time payload, `preload` attribute, overflow menu (report/not interested, device preview icons). |
| `FeedActionRail.tsx` | Vertical actions, active keys, toggle handler from parent. |
| `FeedCommentPanel.tsx` | **Real** `useFeedComments` + `useFeedCommentMutation`; auth requirement + `onRequireAuth`; **optimistic** thread + rollback on error; Escape to close; auto-resize textarea; invalidate on success. |
| `FeedAuthGateModal.tsx` | Gate for anonymous engagement attempts. |
| `FeedShareSheet.tsx` | Modal shell; parent records share on selection. |
| `FeedCaption.tsx` | Caption display. |
| `FeedHashtagList.tsx` | Hashtag list from clip. |
| `CreatorIdentity.tsx` | Presenter block (uses landing presenter constants on landing). |
| `FeedResourceLink.tsx` | Resource label line. |
| `FeedSnapScrollControls.tsx` | Extra scroll UI when sidebar open / layout constraints. |
| `FeedStatePanel.tsx` | Icon + title + message + optional refresh CTA. |
| `FeedSearchInput.tsx` | Present in explorer shell (UX shell). |
| `FeedFilterPanel.tsx` / `FeedFilterTrigger.tsx` | Filter drawer UI in shell (**not** wired to feed query params in analyzed code). |
| `FeedCard.tsx` | Card frame; used by loading skeleton. |
| `FeedOverlayGradient.tsx` | Visual overlay helper. |
| `index.ts` | Barrel exports. |

### Epic F5 — Feed shell & secondary views

| Task | Subtasks (completed / partial) |
|------|------------------------------|
| **F5.1 `FeedExplorerShell`** | Three-column responsive grid; search + filter panel; optional right rail; `afterGrid` slot for snap controls. |
| **F5.2 `FeedLoadingState`** | Skeleton aligned to feed video width tokens + rail placeholders; a11y `role="status"`. |
| **F5.3 `FeedWorkerHealthDebugPanel`** | Displays lag, DLQ length, stream length, processed total from API. |
| **F5.4 Hub views** | `SimulationHubView`, `AIExplorerView`, `AudioHubView`, `ExploreAllView` — **layout/shell** using feed explorer patterns; **no separate feed API integration** identified beyond routing/presentation. |

### Epic F6 — Frontend tests

| Task | Subtasks (completed) |
|------|----------------------|
| **F6.1 `LandingPageView.test.tsx`** | Includes preload-related coverage (per project history). |
| **F6.2 `AuthFlows.test.tsx`** | Auth-related feed flows. |

---

## 4. Cross-cutting (already done)

| Task | Detail |
|------|--------|
| **Contract alignment** | `FeedItemPublic` fields map to `LandingVideoClip`-style usage (`videoSrc`, `mediaTone`, counts, flags). |
| **Security** | Engagements and telemetry POSTs require auth on backend; frontend skips telemetry when logged out (except local hide UI). |
| **Idempotency** | Frontend sends `Idempotency-Key` on write operations that support it. |
| **Realtime** | Backend Pub/Sub + WS; frontend subscriber updates counts without full refetch. |

---

## 5. Not wired / not implemented (explicit gaps)

Use this section for **follow-up tickets** (not claimed as done).

| Item | Detail |
|------|--------|
| **Cursor pagination (FE)** | Backend returns `next_cursor` / `has_more`; landing uses **first page only** — no “load more” / infinite scroll hookup. |
| **`fetchFeedItem`** | No detail page or prefetch flow calling it. |
| **`postFeedEnroll`** | No UI wiring from “Go to Course” or enroll CTA. |
| **`fetchFeedTelemetrySummary`** | No admin/analytics view in the app consuming it. |
| **Filter/search → API** | `FeedFilterPanel` / `FeedSearchInput` do not drive `content_type`, search, or cursor in analyzed code. |
| **Hub-specific data** | Simulation / AI / Audio / Explore-all are not separate FYP datasets in code. |
| **WebSocket: anonymous** | By design, WS requires token; anonymous users do not get realtime updates. |
| **Share sheet: native share** | Sheet UI exists; actual OS share API / deep link generation may still be product work. |

---

## 6. Quick file reference

| Area | Path |
|------|------|
| Backend routes | `deltalabs-backend/app/api/v1/feed.py` |
| Content FYP logic | `deltalabs-backend/app/domain/content/service.py` |
| Engagement logic | `deltalabs-backend/app/domain/engagement/service.py` |
| Queue / PubSub | `deltalabs-backend/app/domain/engagement/queue.py` |
| Frontend API | `deltalabs-frontend/src/modules/Feed/api/index.ts` |
| Frontend hooks | `deltalabs-frontend/src/modules/Feed/hooks/useFeedQueries.ts` |
| Landing | `deltalabs-frontend/src/modules/Feed/views/LandingPageView.tsx` |
| Comments UI | `deltalabs-frontend/src/components/features/feed/master/FeedCommentPanel.tsx` |
| Media / telemetry | `deltalabs-frontend/src/components/features/feed/master/FeedMedia.tsx` |

---

## 7. Submission-ready task names (Task / Subtask format)

Use the lines below directly in Jira/Linear.

### Backend tasks

- **Task B1 — Implement Feed HTTP API surface (`/v1/feed`)**
  - **Subtask B1.1:** Implement list feed endpoint with cursor + filters (`GET /v1/feed`)
  - **Subtask B1.2:** Implement single feed item endpoint (`GET /v1/feed/{item_id}`)
  - **Subtask B1.3:** Implement like toggle endpoint with idempotency (`POST /v1/feed/{item_id}/like`)
  - **Subtask B1.4:** Implement save toggle endpoint with idempotency (`POST /v1/feed/{item_id}/save`)
  - **Subtask B1.5:** Implement share endpoint with idempotency (`POST /v1/feed/{item_id}/share`)
  - **Subtask B1.6:** Implement comment create endpoint with idempotency (`POST /v1/feed/{item_id}/comment`)
  - **Subtask B1.7:** Implement comments list endpoint (`GET /v1/feed/{item_id}/comments`)
  - **Subtask B1.8:** Implement telemetry event endpoint (`POST /v1/feed/{item_id}/event`)
  - **Subtask B1.9:** Implement enroll placeholder endpoint (`POST /v1/feed/{item_id}/enroll`)
  - **Subtask B1.10:** Implement telemetry summary endpoint (`GET /v1/feed/telemetry/summary`)
  - **Subtask B1.11:** Implement worker health endpoint (`GET /v1/feed/worker/health`)

- **Task B2 — Implement FYP ranking and personalization logic**
  - **Subtask B2.1:** Implement feed cursor decode/encode validation
  - **Subtask B2.2:** Implement public item listing with optional content-type filtering
  - **Subtask B2.3:** Implement personalization fallback when filtered result is empty
  - **Subtask B2.4:** Implement read-time engagement snapshot enrichment
  - **Subtask B2.5:** Build user signal profile from recent events and engagement
  - **Subtask B2.6:** Implement reranking strategy (recency + hashtag + event + jitter)
  - **Subtask B2.7:** Implement deterministic cold-start shuffle
  - **Subtask B2.8:** Bootstrap content read indexes

- **Task B3 — Implement feed engagement domain services**
  - **Subtask B3.1:** Implement like/save toggles with count updates
  - **Subtask B3.2:** Implement comment create/list with display-name enrichment
  - **Subtask B3.3:** Implement share count persistence
  - **Subtask B3.4:** Implement telemetry event persistence
  - **Subtask B3.5:** Implement idempotent replay-or-execute for writes
  - **Subtask B3.6:** Bootstrap engagement indexes

- **Task B4 — Implement realtime and queue processing interfaces**
  - **Subtask B4.1:** Implement Redis stream enqueue for feed engagement events
  - **Subtask B4.2:** Implement Pub/Sub clip update publisher
  - **Subtask B4.3:** Implement dead-letter enqueue helper
  - **Subtask B4.4:** Implement authenticated feed WebSocket with clip subscriptions

- **Task B5 — Implement backend feed test coverage**
  - **Subtask B5.1:** Add feed HTTP smoke coverage
  - **Subtask B5.2:** Add feed cursor unit coverage
  - **Subtask B5.3:** Add personalization unit coverage
  - **Subtask B5.4:** Validate feed router inclusion in API v1

### Frontend tasks

- **Task F1 — Implement feed API client module**
  - **Subtask F1.1:** Define feed DTOs and response types
  - **Subtask F1.2:** Implement paginated feed fetch API
  - **Subtask F1.3:** Implement feed telemetry event API
  - **Subtask F1.4:** Implement like/save/share APIs with idempotency headers
  - **Subtask F1.5:** Implement comments fetch/create APIs
  - **Subtask F1.6:** Implement single feed item API client method
  - **Subtask F1.7:** Implement enroll API client method
  - **Subtask F1.8:** Implement telemetry summary API client method
  - **Subtask F1.9:** Implement worker health API client method
  - **Subtask F1.10:** Implement local debug fallback for empty feed
  - **Subtask F1.11:** Implement debug loading-delay switch

- **Task F2 — Implement feed React Query hooks**
  - **Subtask F2.1:** Implement `useFeedClips`
  - **Subtask F2.2:** Implement `useFeedComments` with DTO-to-preview mapping
  - **Subtask F2.3:** Implement `useFeedEventMutation`
  - **Subtask F2.4:** Implement like/save/share mutation hooks
  - **Subtask F2.5:** Implement comment mutation hook
  - **Subtask F2.6:** Implement worker health polling hook
  - **Subtask F2.7:** Implement centralized feed query keys

- **Task F3 — Implement landing feed behavior (`LandingPageView`)**
  - **Subtask F3.1:** Implement loading/error/empty-state rendering
  - **Subtask F3.2:** Implement local hidden-clip filtering behavior
  - **Subtask F3.3:** Implement active-clip detection via `IntersectionObserver`
  - **Subtask F3.4:** Implement keyboard feed navigation
  - **Subtask F3.5:** Wire telemetry events from media to API mutation
  - **Subtask F3.6:** Implement optimistic like flow with reconciliation
  - **Subtask F3.7:** Implement optimistic save flow with reconciliation
  - **Subtask F3.8:** Implement share-sheet flow with share mutation
  - **Subtask F3.9:** Implement comment sidebar + rail count synchronization
  - **Subtask F3.10:** Implement WebSocket realtime count synchronization
  - **Subtask F3.11:** Seed local engagement flags from server clip data
  - **Subtask F3.12:** Implement global mute state across slides
  - **Subtask F3.13:** Implement proximity-based media preload strategy
  - **Subtask F3.14:** Implement worker health debug panel integration
  - **Subtask F3.15:** Implement auth modal routing from feed actions

- **Task F4 — Implement feed UI components and states**
  - **Subtask F4.1:** Implement feed media viewport composition
  - **Subtask F4.2:** Implement media player controls and telemetry hooks
  - **Subtask F4.3:** Implement action rail toggle/active behavior
  - **Subtask F4.4:** Implement comment panel with optimistic posting
  - **Subtask F4.5:** Implement anonymous action auth-gate modal
  - **Subtask F4.6:** Implement share sheet UI and callbacks
  - **Subtask F4.7:** Implement caption/hashtag/creator/resource visual blocks
  - **Subtask F4.8:** Implement snap-scroll control widget
  - **Subtask F4.9:** Implement feed state panel (error/empty/retry)
  - **Subtask F4.10:** Implement shell search/filter UI components
  - **Subtask F4.11:** Implement feed card/loading visual primitives
  - **Subtask F4.12:** Implement feed component export barrel

- **Task F5 — Implement feed shell and supporting layouts**
  - **Subtask F5.1:** Implement responsive `FeedExplorerShell` layout grid
  - **Subtask F5.2:** Implement `FeedLoadingState` skeleton
  - **Subtask F5.3:** Implement `FeedWorkerHealthDebugPanel`
  - **Subtask F5.4:** Implement feed hub shells (Simulation/AI/Audio/Explore)

- **Task F6 — Implement frontend feed tests**
  - **Subtask F6.1:** Add/maintain landing feed view tests
  - **Subtask F6.2:** Add/maintain feed auth flow tests

---

*Generated from repository analysis for submission as a completed-work checklist. Update §5 when new scope ships.*
