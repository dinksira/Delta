# Live Duel Workspace — Design & Implementation Report

**Status:** Implemented (frontend design deliverable, demo real-time simulation + host create flow)
**Date:** 2026-09-07
**Routes:** lobby list `/features/competitions/live-duels` (reached from the hub "Live Duels" mode card); create `/features/competitions/live-duels/create`; room `/features/competitions/live-duels/[id]` — mirroring the topic battle lobby flow, plus a host flow for creating and running a duel live.

## 1. Concept

A **live-streaming competition room**: a host broadcasts from a stage (the
`LiveHostStage` canvas), posts questions **in real time** to the focal point,
and participants answer in real time while chatting over the stage. The host's
live camera fills the stage as a full-bleed background when they broadcast;
each participant (including the host) has their own on-stage card where their
camera self-view and a `VoiceWaveIndicator` appear — idle blink while the
person is silent, animated waveform while they speak (real mic analysis for the
current user, simulated speaker rotation for demo participants). The room
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
| Molecule | `LiveVideoFeed` | Self-contained live `<video>` tile attaching a shared `MediaStream`; `mirror` for self-view, `shape` square/rounded/circle |
| Molecule | `ParticipantCard` | Zoom/Meet-style rectangle tile: full-bleed camera feed (\(LiveVideoFeed\) mirrored) or monogram, scrim name, top-right mic/camera status, host crown, ocean-ripple voice indicator |
| Molecule | `VoiceWaveIndicator` | Circular "ocean ripples" from a mic glyph, scaled by normalized `level` (idle breathe ↔ speaking pulse, sm/md/lg); driven by `useLiveMediaStream` voice analysis / simulated speakers |
| Molecule | `MediaControlDock` | Mic / camera toggles + red leave, grouped in a translucent capsule |
| Molecule | `StageChatOverlay` | Last 3 comment pills (avatar, username, text, emoji) |
| Molecule | `LiveMessageBar` | White input + dark slate send button (Enter submits) |
| Organism | `LiveHostStage` | Top HUD (LIVE+viewers, host card), ocean-ripple focal or live-question card, mirrored full-bleed host camera, bottom chat + dock |
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

`LiveDuelRoomPage` seeds the provider via `buildLiveDuelRoom(params.id, …)`
(`data/liveDuelsCatalog.ts`) and drives a **demo simulation** — viewer drift,
rotating host questions (with an idle beat, disabled in host mode) and incoming
chat — through the same `dispatch` a real WebSocket/SSE feed would use, so the
view layer never changes when the channel lands. Host mode adds a
`POST_LIVE_QUESTION` action that publishes the host's question to the stage
focal **and** appends it to `room.postedQuestions` history.

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

## 5c. Host create & live question flow

Route `/features/competitions/live-duels/create` → `CreateLiveDuelPage`:

| Piece | Role |
| --- | --- |
| `LiveDuelCreateForm` | Setup form (title, subject, difficulty, duration, entry fee, prize pool, max players) with client validation + a live `LiveDuelCard` lobby preview; "Go Live" |
| `LiveDuelCreateTemplate` | Create-page layout (back + brand header + centered form region) |
| `createLiveDuel(input)` | Session registry (`REGISTERED_LIVE_DUELS` map in `liveDuelsCatalog.ts`): builds a `status: "live"`, `hostIsUser: true` entry, id `live-host-<ts>`; `getLiveDuelsCatalog()` merges it ahead of the demo list so it tops the lobby |
| `LiveDuelRoomPage` | Reads `getLiveDuelEntry(id)?.hostIsUser` to switch the room into **host mode**: seeds via `buildLiveDuelRoom(id, { hostIsUser })` (host participant = current user), disables the demo question auto-rotation, and drops a `HostControlPanel` into the workspace `hostControlSlot` |
| `HostControlPanel` | Host dashboard card: LIVE badge, live viewer pill, on-air question (round/points/timer), composer, posted history with "On air" marker |
| `HostQuestionComposer` | Textarea + point chips (100–1000) + timer select → `POST_LIVE_QUESTION` → question appears at the stage focal for participants and in `room.postedQuestions` |

Posting is fully driven by the same reducer a live feed would use; only the
backend channel (`app/api/v1/competitions.py`) and a `LiveDuelSocket` are
missing to make it truly multi-client.

## 5d. Live camera + voice activity threading (Zoom/Meet-style)

The room is built like Google Meet / Zoom: each participant appears as a
**rectangle video tile** that fills their `ParticipantCard`, and a circular
**ocean ripple** overlays the tile, expanding in proportion to voice volume.

`LiveDuelRoom` calls `useLiveMediaStream()` **once** at the room level. The hook
acquires the user's camera + mic via `getUserMedia`, analyzes the live mic input
with the Web Audio API `AnalyserNode`, and exposes
`{ mediaStream, error, isSpeaking, voiceLevel }` — the raw `MediaStream` plus a
normalized `voiceLevel` (0–1, power-scaled RMS).

The raw stream is threaded through the layout and rendered by the reusable
`LiveVideoFeed` molecule, which attaches the stream to its own local `<video>`
ref. Because each feed owns its own ref, **the same stream renders in multiple
tiles at once** without the single-shared-`ref` collision. Self-views are
mirrored (`-scale-x-100`), exactly like Zoom mirrors your own camera.

| Prop | Passed to | Effect |
| --- | --- | --- |
| `mediaStream` | `LiveHostStage` (mirrored full-bleed) + `ParticipantGrid` → own card | The host sees their camera fill the stage and their own rectangle tile simultaneously. |
| `isSpeaking` | `LiveHostStage` focal point + `ParticipantGrid` → own card | Gates the `VoiceWaveIndicator` ocean ripple on/off. |
| `voiceLevel` | `LiveHostStage` focal point + `ParticipantGrid` → own card | Drives `--dl-ripple-scale/opacity` so the ripple swells with actual volume. |
| `speakingIds` | `ParticipantGrid` | Room-level simulated speaker rotation (5.2 s tick, 4 s hold) drives other cards' ripples. |

The stage full-bleed video is gated on `isHost` — participants never take over
the stage canvas. Participants always appear in their own grid card
(`buildLiveDuelRoom` ensures a `isYou: true` card is always present).

## 5e. Chat deduplication (idempotent realtime append)

The backend WS fans an `APPEND_CHAT_MESSAGE` back to *every* subscriber,
including the sender. To keep the chat array idempotent (an echo or a dev-mode
StrictMode double-connect must not yield two rows with the same message id), the
`APPEND_CHAT_MESSAGE` reducer now skips appending when an identical `message.id`
is already present, and `StageChatOverlay` additionally de-dupes by id before
rendering its visible window. Live Duel chat ids are Mongo ObjectIds (24-hex)
produced on the backend; demo chatter uses `crypto.randomUUID()`.

## 6. Verification

- `eslint` clean on all new/changed files.
- `tsc --noEmit`: no errors in any new/edited file (repo baseline has unrelated
  pre-existing School/Features errors).
- Browser-verified: no more "two children with the same key" console warnings
  when the realtime chat channel is active; camera self-view mirrored and shown
  full-bleed in the participant tile rectangle (plus host stage when hosting);
  ocean-ripple voice indicator scales with mic level.

## 7. Next steps (backend real-time)

1. Multi-party camera: WebRTC or SFU so participants see each other's cameras
   (currently self-view only; each card shows its own stream locally).
2. Simulated speaker rotation can be replaced by WebRTC audio level reports
   from the SFU when multi-party streaming lands.
3. Back the lobby (`DEMO_LIVE_DUELS`) and `joinLiveDuel` with real endpoints;
   today the hub card lands on the client-seeded lobby and room.