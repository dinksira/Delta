# Competition Module

The Competition module handles browsing, viewing, hosting, and launching competitions in Delta Labs.

## Routes

| Route | Component | Description |
|---|---|---|
| `/features/competitions` | `PublicCompetitionPage` | Hub: "Public Competitions" tab (status cards, achievements, game modes, upcoming) + "My Competitions" tab (editable custom table). Backed by `GET /v1/competitions/hub` |
| `/features/competitions/topic-battles` | `ActiveCompetitionPage` | Topic Battles lobby: search + subject pills + live "Open Battles" grid. Backed by `GET /v1/competitions/topic-battles` |
| `/features/competitions/host` | `HostCompetitionPage` | 5-step wizard to create/publish a competition |
| `/features/competitions/:id` | `CompetitionDetailPage` | Detail view with banner, prizes, timeline, challenge enrollment |
| `/features/competitions/battles/:id` | `TopicBattleDuelPage` | Duel quiz screen for a joined battle: header, question card, metrics, leaderboard sidebar |

## Directory Structure

```
Competition/
├── api/index.ts               # API functions via apiClient (hub, modes, topic-battles, topic-battle detail, join)
├── context/
│   └── CompetitionFilterContext.tsx  # activeCategory + searchQuery via context
├── data/
│   ├── termsConfig.ts          # Static T&C text for enrollment
│   └── duelQuiz.ts             # Curated subject MCQ decks + buildDuelQuiz(battle) fallback generator
├── hooks/
│   ├── useCompetitionHub.ts    # Combines topic battles + hub data (modes, userStatus, achievements, myBattles)
│   ├── useCompetitionHubData.ts # Queries GET /v1/competitions/hub
│   ├── competitionHubQueryKeys.ts # React Query key factory
│   ├── useTopicBattles.ts      # Live topic battles list + filters (search/subject/difficulty)
│   ├── useJoinTopicBattle.ts   # Join mutation with optimistic invalidation
│   ├── useJoinBattleModal.ts   # Join Topic Battle modal controller (open/close/confirm/success)
│   ├── useDuelQuiz.ts          # Duel quiz state machine (question index, answer, score/rank, timer)
│   ├── useCompetitionDetail.ts # Fetch detail by ID
│   ├── useCustomTable.ts       # Editable table state (columns/rows/add/remove/select)
│   ├── useFilteredCompetitions.ts # Category filter + debounced search
│   ├── useHostCompetitionWizard.ts # Full 5-step wizard state (30+ methods)
│   └── usePublicData.tsx       # Public hub data with icon mapping
├── types/
│   ├── hub.ts                  # CompetitionHubResponse, UserStatus, Achievement, GameMode, MyBattle
│   ├── public.ts               # CompetitionTab, UserStatus, Achievement, GameMode, UpcomingCompetition, CustomTableState
│   ├── host.ts                 # HostCompetitionDraft, PrizeEntry, PhaseEntry, CompetitionModuleType, CodeEditorQuestion, CodeEditorModuleState
│   ├── duelQuiz.ts             # DuelQuestion, DuelLeaderboardEntry, DuelQuiz, DuelState
│   └── detail.ts               # CompetitionDetail, CompetitionPrize, CompetitionTimelineStep
├── utils/
│   ├── launchSummary.ts        # deriveLaunchSummary() — extracts 6 fields from draft for ConfirmLaunchModal
│   └── index.ts                # getCategoryLabel(), formatEndsDate()
└── views/
    ├── ActiveCompetitionPage.tsx
    ├── CompetitionDetail/CompetitionDetailPage.tsx
    ├── HostCompetitionPage.tsx
    ├── PublicCompetitionPage.tsx
    ├── TopicBattleDuelPage.tsx
    └── index.ts
```

## Host Competition Wizard (5 Steps)

**Hook:** `useHostCompetitionWizard()` — single source of truth for all wizard state.

### Step 0: Overview
Cover image upload (`UploadDropzone` atom), title, description. Validation: title required.

### Step 1: Prize Details
Repeatable `PrizeEntryCard` molecules — rank, type (money/other), value description, win condition. Validation: at least one prize.

### Step 2: Timeline
Repeatable `PhaseEntryCard` molecules — phase name, description, start/end dates. Validation: at least one phase, end ≥ start.

### Step 3: Terms & Conditions
`TermsStep` organism — contentEditable rich text editor with Bold/Italic/Underline/Strikethrough/Link/Align/List buttons (using `document.execCommand`). Requires checkbox agreement.

### Step 4: Workspace
Three-column layout: ModuleList (left) → content panel (center) → Module Setting panel (right). Only **Code Editor** is implemented; others show placeholder text.

**Code Editor Module:**
- Per-question state (Q1, Q2, Q3...) each with independent language/difficulty/timer/points/hint settings
- `CodeEditorField` atom: VS Code-style syntax highlighting with 15 language keyword sets (JS, TS, Python, HTML, CSS, Java, C++, C#, Go, Rust, SQL, PHP, Ruby, Swift, Kotlin)
- Uses transparent-textarea-over-`<pre>` pattern for highlighting without external libraries
- Language-aware: comments (`//`, `#`, `--`, `/* */`, `<!-- -->`), strings, keywords (blue), builtins (teal), numbers (green)

**Launch flow:** "Launch" button opens `ConfirmLaunchModal` (read-only summary derived from draft). Confirm → calls `launchCompetition()` → navigates to `/features/competitions`. Cancel/Escape/backdrop closes modal. Inline error on API failure.

## Components Used

Key shared components from `src/components/`:
- **PageHeader** — Back arrow + trophy icon + title + action buttons (Integrate/Search, Automate/RefreshCw, Invite/UserPlus) + Share2 button
- **TabsRow** — Tab navigation with search + optional rightSlot (MyCompetitionToolbar)
- **Modal** — Reused for TermsAndConditionsModal and ConfirmLaunchModal
- **CustomizableTable** — Reusable editable table in `organisms/CustomizableTable/`
- **Switch** — Toggle for Hint on/off
- **Button, Input, Textarea, Select, Field** — Theme primitives

## Components Used (duel quiz)

- **QuizBattleTemplate** — page layout: header + question/metrics column + leaderboard sidebar; results panel when finished
- **QuizBattleHeader** — title, PTS badge, players badge, countdown pill, question `ProgressBar`
- **QuizQuestionCard** — question text + `QuizOption` list with reveal states
- **QuizMetricsRow / MetricTile** — SCORE / #RANK / CORRECT stat strip
- **LeaderboardPanel / LeaderboardRow** — ranked participants sidebar, current-user highlight
- **QuizResultsPanel** — post-duel summary with Play Again / Back to Battles

## Module State Shape (HostCompetitionDraft)

```typescript
{
  overview: { coverImage, coverImagePreview, title, description }
  prizes: PrizeEntry[]          // rank, type, valueDescription, winCondition
  timeline: PhaseEntry[]        // phaseName, description, startDate, endDate
  terms: { richTextContent, agreed }
  workspace: { selectedModule, moduleConfig: { "code-editor": CodeEditorModuleState } }
  status: "draft" | "published"
}
```

## API Endpoints

| Function | Method | Path |
|---|---|---|
| `fetchCompetitionHub()` | GET | `/v1/competitions/hub` |
| `fetchCompetitionModes()` | GET | `/v1/competitions/modes` |
| `fetchTopicBattles()` | GET | `/v1/competitions/topic-battles` |
| `fetchTopicBattle(id)` | GET | `/v1/competitions/topic-battles/{id}` |
| `joinTopicBattle(id)` | POST | `/v1/competitions/topic-battles/{id}/join` |

## Join Topic Battle Flow (micro-interaction)

Tapping **Join Battle** on a `TopicBattleCard` opens the `JoinTopicBattleModal` (organism) instead of joining immediately — a confirmation gate that prevents mis-taps on paid entries.

- **Trigger** — card's `onJoinBattle` → `ActiveCompetitionPage` looks up the battle and calls `useJoinBattleModal().openFor(battle)`.
- **Confirm view** — `Dialog` (theme, `sm`) titled "Join Topic Battle" with: intro copy (free vs. fee wording), `BattleSummaryPanel` recap (status/difficulty, title, subject/creator, players/prize/entry, progress bar), ShieldCheck terms line, optional guest warning (`isGuest`), optional error `StatusBanner`, and a footer of ghost "Not now" + primary "Confirm & Join" / "Join for {entryFee}".
- **Submit** — confirm fires `useJoinTopicBattle` → `POST /v1/competitions/topic-battles/{id}/join`. Buttons disable, spinner shows, and dismissal (Escape/backdrop/✕) is blocked while `isSubmitting`.
- **Success** — the hook sets `isSuccess` (per battle id); the modal swaps to a centered "You're in!" view with a `CheckCircle2` mark and "View Battle" (→ duel route `/features/competitions/battles/{id}`) / "Done" actions. The list query is invalidated so the card flips to "Joined".
- **Error** — backend failures (e.g. `cannot_join_own_battle` 403, battle full 409) render as an inline error banner; the confirm view stays open so the user can retry or cancel.

Owner battles are excluded entirely: the card renders "Manage & Track" instead of a join CTA, so the modal is only reachable for joinable battles.

## Topic Battle Duel Quiz (post-join view)

After joining, **View Battle** (card `onOpenBattle` and the modal's success action) routes to `/features/competitions/battles/{id}` — the `TopicBattleDuelPage` duel quiz screen. The backend serves code-editor questions only, so the MCQ deck is generated client-side.

- **Deck resolution** — `buildDuelQuiz(battle)` in `data/duelQuiz.ts` matches the battle's subject against curated subject decks (math, physics, chemistry, biology, english, history, AI, programming); unknown subjects fall back to a general-knowledge deck. A mock leaderboard is derived from `playersJoined`, the creator, and "You".
- **State** — `useDuelQuiz(quiz)` owns `DuelState` (question index, selected answer, `isAnswered`, score, rank, correct count) plus a 30-second per-question countdown. `selectAnswer` locks the answer, scores +100 pts on a correct pick, and derives rank by counting leaderboard entries above the current score. `advance` moves to the next question (or the finished state on the last one).
- **Layout** — `QuizBattleTemplate`: `QuizBattleHeader` (title, PTS/players badges, timer pill, progress) → `QuizQuestionCard` (A–D options with correct/incorrect reveal) → "Next Question" / "See Results" button → `QuizMetricsRow` (SCORE / #RANK / CORRECT), with the `LeaderboardPanel` sidebar at `lg+`.
- **Finished** — the template swaps to `QuizResultsPanel` (points / correct / rank, Play Again resets via `useDuelQuiz.reset`, Back to Battles navigates to the lobby).

## Components Used (duel quiz)


