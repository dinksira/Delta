# Live Duel Workspace — Design & Implementation Report

**Status:** Implemented (frontend design deliverable, demo real-time simulation)
**Date:** 2026-09-07
**Routes:** lobby list `/features/competitions/live-duels` (reached from the hub "Live Duels" mode card); room `/features/competitions/live-duels/[id]` — mirroring the topic battle lobby flow.

## 1. Concept

A **live-streaming competition room**: a host broadcasts from a stage (the
`LiveHostStage` canvas), posts questions **in real time** to the focal point,
and participants answer in real time while chatting over the stage. The room
shows live viewer count, an on-stage participant grid, a live leaderboard, and
host-authored question cards with a countdown.

## 2. Spec → Design-token mapping

The provided spec used raw hex. Per §3 (tokens only) those map onto the existing
scale:

| Spec value | Token(s) used | Notes |
| --- | --- | --- |
| `#E1E8EC` stage canvas | `bg-surface-muted` + `primary-200/300` blurred backdrops | Surface stays token-driven in dark mode |
| `#D8E1E6` containers | `bg-surface-default` + `border-border-default` | Cards/panels |
| `#194B5E` / `#133E4D` accent | `primary-600` / `primary-700` | Brand already anchors at the same values |
| `#D30000` LIVE red | `error-600` (badge/leave), `error-50` status pill bg | No token equals `#D30000`; closest pair used |
| Translucent dark pills (chat, dock, host card) | `bg-primary-900/70`, `bg-primary-900/60` + `backdrop-blur-sm` | |

No raw hex, inline styles, or arbitrary Tailwind values were introduced.

## 3. Atomic components built (library-first, §2/§4/§5)

| Level | Component | Role |
| --- | --- | --- |
| Atom | `Avatar` | Image or monogram-initials circular avatar; reused across all identity chips |
| Atom | `LiveBadge` | Pulsing red LIVE pill |
| Atom | `IconButton` | Round icon-only button (surface/primary/danger, `isActive` fill) — new pattern, `Button` stays rectangular |
| Molecule | `ParticipantCard` | Centered monogram, bottom-left name, top-right mic/camera status, host crown |
| Molecule | `MediaControlDock` | Mic / camera toggles + red leave, grouped in a translucent capsule |
| Molecule | `StageChatOverlay` | Last 3 comment pills (avatar, username, text, emoji) |
| Molecule | `LiveMessageBar` | White input + dark slate send button (Enter submits) |
| Organism | `LiveHostStage` | Top HUD (LIVE+viewers, host card), ripple focal or live-question card, bottom chat + dock |
| Organism | `ParticipantGrid` | 4→3→2 column grid under "On Stage" |
| Organism | `BattleStatusPanel` | Active Players / Status LIVE / Host rows + full-width "Leave Battle" |
| Organism | `LiveLeaderboardPanel` | Scrollable ranked list; points stacked over "Points" |
| Template | `LiveDuelWorkspaceTemplate` | 70/30 two-column desktop layout; stacked below `lg` |

`LeaderboardRow` was **extended in source** (new optional `pointsLabel`) rather
than duplicated — the sanctioned path for a new variant.

## 4. Layout & responsive behavior

- **Desktop (`lg`/`xl`):** `flex lg:flex-row` — left `main` (stage → participant
  grid → message bar) and right `aside` (`lg:w-[340px]`) stacking
  `BattleStatusPanel` then `LiveLeaderboardPanel` (leaderboard scroll
  caps at `max-h-[320px]`).
- **Tablet / mobile (`sm`/`md`):** everything stacks vertically in reading
  order: stage → participants → input → battle status → leaderboard.

## 5. State model (§6.4 Context + reducer)

`src/modules/Competition/context/LiveDuelContext.tsx` owns `LiveDuelState`
(`{ room, isMicMuted, isCameraOff }`) via a reducer with `[VERB]_[NOUN]`
actions (`UPDATE_VIEWERS`, `SET_LIVE_QUESTION`, `APPEND_CHAT_MESSAGE`,
`TOGGLE_MIC`, `TOGGLE_CAMERA`, …). `useLiveDuel()` throws outside the provider.
The provider seeds from `data/liveDuels.ts` (`DEMO_LIVE_ROOM`,
`DEMO_LIVE_QUESTIONS`, `DEMO_CHAT_ROTATION`) and accepts an `initialRoom` prop.

`LiveDuelRoomPage` seeds the provider via `buildLiveDuelRoom(params.id)`
(`data/liveDuelsCatalog.ts`) and drives a **demo simulation** — viewer drift,
rotating host questions (with an idle beat) and incoming chat — through the same
`dispatch` a real WebSocket/SSE feed would use, so the view layer never changes
when the channel lands.

## 5b. Lobby & join flow (mirrors Topic Battles)

| Piece | Role |
| --- | --- |
| `data/liveDuelsCatalog.ts` | `DEMO_LIVE_DUELS` (6 entries), `DEMO_LIVE_DUELS_SEED`, `buildLiveDuelRoom(entryId?)` |
| `LiveDuelCard` | Lobby card: status/live pill, viewers, host, subject·difficulty·duration, entry/prize economics, player fill, and a CTA that progresses Join → Enter Duel once joined |
| `LiveDuelGrid` | 1→2→3 column grid + empty state |
| `JoinLiveDuelModal` | Confirmation (recap, entry terms, guest note, error, confirm/cancel) → success view with "Enter Duel" |
| `LiveDuelsListTemplate` + `LiveDuelsPage` | Back+brand header, SearchPill (search + difficulty), SubjectPills, grid + count |
| `useJoinLiveDuel` + `useJoinLiveDuelModal` | Mutation + modal controller (open/confirm/submitting/error/success) |
| `api#joinLiveDuel` | Stub resolving after latency until the backend room channel lands |

The user joins a duel only through the modal (exact topic-battle steps); on
success "Enter Duel" routes `router.push('/features/competitions/live-duels/${id}')`.

## 6. Verification

- `eslint` clean on all new/changed files.
- `tsc --noEmit`: no errors in any new/edited file (repo baseline has unrelated
  pre-existing School/Features errors).

## 7. Next steps (backend real-time)

1. Add a battle `room_kind: "live"` + host start/join endpoints to
   `deltalabs-backend`
   (`app/api/v1/competitions.py`), following the existing feed WebSocket
   (`app/api/v1/feed.py:364`) Redis pub/sub pattern.
2. Wire a `LiveDuelSocket` that dispatches `UPDATE_VIEWERS`,
   `SET_LIVE_QUESTION`, `APPEND_CHAT_MESSAGE`, `UPDATE_LEADERBOARD` into the
   context; answer submissions connect to the auto-grade path used by
   `TopicBattleDuelPage`.
3. Back the lobby (`DEMO_LIVE_DUELS`) and `joinLiveDuel` with real endpoints;
   today the hub card lands on the client-seeded lobby and room.