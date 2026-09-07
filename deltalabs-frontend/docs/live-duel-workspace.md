# Live Duel Workspace — Design & Implementation Report

**Status:** Implemented (frontend design deliverable, real mobile-first join via backend Live Duel channel + host create flow)
**Date:** 2026-09-07
**Routes:** lobby list `/features/competitions/live-duels` (reached from the hub "Live Duels" mode card); create `/features/competitions/live-duels/create`; room `/features/competitions/live-duels/[id]` — mirroring the topic battle lobby flow, plus a host flow for creating and running a duel live.

## 1. Concept

A **live-streaming competition room**: a host broadcasts from a stage (the
`LiveHostStage` canvas), posts questions **in real time** to the focal point,
and participants answer in real time while chatting over the stage. The host's
live camera fills the stage as a full-bleed background when they broadcast;
each participant (including the host) has their own on-stage card where their
camera self-view and a `VoiceWaveIndicator` appear — idle blink while the
person is silent, animated waveform while they speak (real mic analysis from
`useLiveMediaStream`). The grid shows only **real users** — the host, the
current user, and (for backend rooms) joined participants pushed over the room
WebSocket (`JOIN_LIVE_DUEL` → `ADD_PARTICIPANT`) — there are no mock
participants or simulated speakers. The room shows live viewer count, an
on-stage participant grid, a live leaderboard, and host-authored question cards
with a countdown.

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
| Molecule | `VoiceWaveIndicator` | Circular "ocean ripples" from a mic glyph, scaled by normalized `level` (idle breathe ↔ speaking pulse, sm/md/lg); driven by the real `useLiveMediaStream` voice level (self-view + host focal) |
| Molecule | `MediaControlDock` | Mic / camera toggles + red leave, grouped in a translucent capsule |
| Molecule | `StageChatOverlay` | Last 3 comment pills (avatar, username, text, emoji) |
| Molecule | `LiveMessageBar` | White input + dark slate send button (Enter submits) |
| Organism | `LiveHostStage` | Top HUD (LIVE+viewers, host card), ocean-ripple focal or live-question card, mirrored full-bleed host camera, bottom chat + dock |
| Organism | `ParticipantGrid` | 4→3→2 column grid under "On Stage" |
| Organism | `BattleStatusPanel` | Active Players / Status LIVE / Host rows + full-width "Leave Battle" |
| Organism | `LeaveLiveDuelModal` | Confirm-before-leave gate: token `Dialog` (sm), room-named copy, "Stay in duel" / danger "Leave duel" (Escape + close cancel, confirm auto-focus) |
| Organism | `QuestionModal` | Read-only on-air question display for all nine kinds (MCQ / T/F / fill-blank / matching / writing / ordering / coding / markdown / design); opens when a question is posted; answers not revealed; reduced payloads fall back to sanitized rich text via the `RichText` atom |
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
`ADD_PARTICIPANT`, `TOGGLE_MIC`, `TOGGLE_CAMERA`, …). `useLiveDuel()` throws
outside the provider. The provider seeds from `data/liveDuels.ts`
(`DEMO_LIVE_ROOM`, `DEMO_LIVE_QUESTIONS`) and accepts an `initialRoom` prop.

`LiveDuelRoomPage` seeds the provider via `buildLiveDuelRoom(params.id, …)`
(`data/liveDuelsCatalog.ts`) with the real current-user identity
(`useAuthSession`) and drives a light **demo simulation** — viewer drift and
rotating host questions (with an idle beat, disabled in host mode) — through the
same `dispatch` a real WebSocket/SSE feed would use, so the view layer never
changes when the channel lands. No mock participants or simulated chatter exist:
backend rooms seed the grid from the room-detail roster and add joiners live.
Host mode adds a `POST_LIVE_QUESTION` action that publishes the host's question
to the stage focal **and** appends it to `room.postedQuestions` history.

## 5b. Lobby & join flow (mirrors Topic Battles)

| Piece | Role |
| --- | --- |
| `data/liveDuelsCatalog.ts` | `DEMO_LIVE_DUELS` (6 entries), `DEMO_LIVE_DUELS_SEED`, `buildLiveDuelRoom(entryId?, options?)` |
| `LiveDuelCard` | Lobby card: status/live pill, viewers, host, subject·difficulty·duration, entry/prize economics, player fill, and a CTA that progresses Join → Enter Duel once joined |
| `LiveDuelGrid` | 1→2→3 column grid + empty state |
| `JoinLiveDuelModal` | Confirmation (recap, entry terms, guest note, error, confirm/cancel) → success view with "Enter Duel" |
| `LiveDuelsListTemplate` + `LiveDuelsPage` | Back+brand header, SearchPill (search + difficulty), SubjectPills, grid + count |
| `useJoinLiveDuel` + `useJoinLiveDuelModal` | Mutation + modal controller (open/confirm/submitting/error/success) |
| `api#joinLiveDuel` | Real backend call: `POST /v1/live-duels/{id}/join` (backend auto-joins the host as room owner; no frontend body needed) |

The user joins a duel only through the modal (exact topic-battle steps); on
success "Enter Duel" routes `router.push('/features/competitions/live-duels/${id}')`.

## 5c. Host create & live question flow

Route `/features/competitions/live-duels/create` → `CreateLiveDuelPage`:

| Piece | Role |
| --- | --- |
| `LiveDuelCreateForm` | Setup form (title, subject, difficulty, duration, entry fee, prize pool, max players) with client validation + a live `LiveDuelCard` lobby preview; "Go Live" |
| `LiveDuelCreateTemplate` | Create-page layout (back + brand header + centered form region) |
| `createLiveDuel(input)` | Session registry (`REGISTERED_LIVE_DUELS` map in `liveDuelsCatalog.ts`): builds a `status: "live"`, `hostIsUser: true` entry, id `live-host-<ts>`; `getLiveDuelsCatalog()` merges it ahead of the demo list so it tops the lobby |
| `LiveDuelRoomPage` | Reads `getLiveDuelEntry(id)?.hostIsUser` to switch the room into **host mode**: seeds via `buildLiveDuelRoom(id, { hostIsUser })` (host participant = current user), disables the demo question auto-rotation, and drops a `HostControlPanel` into the workspace `hostControlSlot`. Host mode is **runtime state**: the backend's `GET /{room_id}` derives `hostIsUser` from the authenticated requester, and `upsertLiveDuelEntry` no longer downgrades it, so a refreshing host keeps (or regains) their question builder once the room detail round-trips. Backend-room rosters seed from the real room detail (`participants`) plus the current user's account identity (`useAuthSession`), and joiners appear live over the socket (`JOIN_LIVE_DUEL` → `ADD_PARTICIPANT`) |
| `HostControlPanel` | Host dashboard card: LIVE badge, live viewer pill, on-air question (round/points/timer), composer, posted history with "On air" marker |
| `HostQuestionComposer` | Full Question Builder canvas for every kind (line to the create-flow `QuestionAuthoringEditor` / `CodeEditorModule` / `MarkdownPadModule` / `DesignCanvasModule`) + point chips (100–1000) + timer select → `POST_LIVE_QUESTION` carrying the full authored payload on `LiveQuestion.question` → `QuestionModal` opens with the real structure, and the question appears at the stage focal for participants + in `room.postedQuestions` |

Posting is fully driven by the same reducer a live feed would use. The backend
Live Duel channel now broadcasts `POST_LIVE_QUESTION` (reduced payload) and
`JOIN_LIVE_DUEL` (real joiner identity) over the room WebSocket, so joining a
stored room with a second account makes it truly multi-client:

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

The stage full-bleed video is gated on `isHost` — participants never take over
the stage canvas. Participants always appear in their own grid card
(`buildLiveDuelRoom` ensures a `isYou: true` card is always present: the current
user, or the host when hosting). Only real users render — the old simulated
`speakingIds` speaker rotation was removed along with the mock roster.

## 5e. Chat deduplication (idempotent realtime append)

The backend WS fans an `APPEND_CHAT_MESSAGE` back to *every* subscriber,
including the sender. To keep the chat array idempotent (an echo or a dev-mode
StrictMode double-connect must not yield two rows with the same message id), the
`APPEND_CHAT_MESSAGE` reducer now skips appending when an identical `message.id`
is already present, and `StageChatOverlay` additionally de-dupes by id before
rendering its visible window. Live Duel chat ids are Mongo ObjectIds (24-hex)
produced on the backend.

`ADD_PARTICIPANT` de-dupes identically: a joiner's card is added once per room
even if the `JOIN_LIVE_DUEL` fan-out is echoed or the socket idempotently
re-connects, so the on-stage grid matches the real joined roster from the room
detail (`participants`).

## 5f. On-air question modal (every kind)

When a round goes on air, the full authored question must actually be visible
for the room — not just the flat one-line `text`. `LiveQuestion` now carries the
whole draft on an optional `question?: CodingQuestion | null`, and
`HostQuestionComposer.handlePost` stamps `question: draft` onto the posted
`LiveQuestion`. `LiveDuelRoomPage` renders a `QuestionModal` (token `Dialog`,
`size="2xl"`) that opens for **every** viewer — host and participant alike —
whenever a new question enters the room state (`room.liveQuestion` id changes):
frontend `POST_LIVE_QUESTION`, demo `SET_LIVE_QUESTION` rotation, or the backend
WS fan-out. An idle beat (null) clears the seen-id so the demo deck loop re-opens
the next round. The modal is driven off the room state reducer, so the view never
changes when the realtime channel lands (per §6.4).

`QuestionModal` renders each of the nine kinds read-only (MCQ lettered options,
T/F rows, fill-blank stem with `[data-blank]` boxes, two-column matching, prompt /
ordering / coding / markdown / design views reusing the `RichText` + `Markdown`
atoms). Correct answers are intentionally **not** revealed while the round is
live. Reduced payloads (backend WS echo of only `text`, demo deck) fall back to
a sanitized rich-text display via the `RichText` atom — the flat text renders
formatted (`<b>`/`<i>`/lists survive; `script`/`style`/event handlers are
stripped), never as raw markup. The same `RichText` fallback renders the on-air
card and posted history in `LiveHostStage` / `HostControlPanel`.

## 6. Verification

- `eslint` clean on all new/changed files.
- `tsc --noEmit`: no errors in any new/edited file (repo baseline has unrelated
  pre-existing School/Features errors).
- Browser-verified: no more "two children with the same key" console warnings
  when the realtime chat channel is active; camera self-view mirrored and shown
  full-bleed in the participant tile rectangle (plus host stage when hosting);
  ocean-ripple voice indicator scales with mic level; posting any question kind
  opens the `QuestionModal` with the real structured content **for the host, and
  participants/demo viewers see the modal pop when the question comes on air**;
  the offline create flow shows Host Control + question builder immediately
  (regression-checked after the `hostIsUser` reload fix) and the on-stage grid
  shows only real users — host, current user, and socket-pushed joiners.

## 7. Next steps (backend real-time)

1. Multi-party camera: WebRTC or SFU so participants see each other's cameras
   (currently self-view only; each card shows its own stream locally).
2. Real per-user WebRTC audio level reports from the SFU can drive other cards'
   voice ripples when multi-party streaming lands (self + host focal already use
   real mic analysis).
3. Pending live-duel answers/judge scoring; the lobby already merges backend
   `REGISTERED_LIVE_DUELS`-style stored rooms via `GET /v1/live-duels`.