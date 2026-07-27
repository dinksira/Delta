# Competition Module

The Competition module handles browsing, viewing, hosting, and launching competitions in Delta Labs.

## Routes

| Route | Component | Description |
|---|---|---|
| `/features/competitions` | `PublicCompetitionPage` | Hub: "Public Competitions" tab (status cards, achievements, game modes, upcoming) + "My Competitions" tab (editable custom table) |
| `/features/competitions/host` | `HostCompetitionPage` | 5-step wizard to create/publish a competition |
| `/features/competitions/:id` | `CompetitionDetailPage` | Detail view with banner, prizes, timeline, challenge enrollment |
| `/features/competitions/list` | `ActiveCompetitionPage` | Filterable grid of active/recent/community competitions |

## Directory Structure

```
Competition/
├── api/index.ts               # 5 API stubs (GET/POST via apiClient)
├── context/
│   └── CompetitionFilterContext.tsx  # activeCategory + searchQuery via context
├── data/
│   ├── mockCompetitions.ts     # 10 mock competitions
│   ├── mockCompetitionDetails.ts # 2 detailed entries
│   ├── mockPublicData.ts       # User status, achievements, game modes, upcoming
│   └── termsConfig.ts          # Static T&C text for enrollment
├── hooks/
│   ├── useCompetitions.ts      # Fetch list with mock delay
│   ├── useCompetitionDetail.ts # Fetch detail by ID
│   ├── useCustomTable.ts       # Editable table state (columns/rows/add/remove/select)
│   ├── useFilteredCompetitions.ts # Category filter + debounced search
│   ├── useHostCompetitionWizard.ts # Full 5-step wizard state (30+ methods)
│   └── usePublicData.tsx       # Public hub data with icon mapping
├── types/
│   ├── public.ts               # CompetitionTab, UserStatus, Achievement, GameMode, UpcomingCompetition, CustomTableState
│   ├── host.ts                 # HostCompetitionDraft, PrizeEntry, PhaseEntry, CompetitionModuleType, CodeEditorQuestion, CodeEditorModuleState
│   └── detail.ts               # CompetitionDetail, CompetitionPrize, CompetitionTimelineStep
├── utils/
│   ├── launchSummary.ts        # deriveLaunchSummary() — extracts 6 fields from draft for ConfirmLaunchModal
│   └── index.ts                # getCategoryLabel(), formatEndsDate()
└── views/
    ├── ActiveCompetitionPage.tsx
    ├── CompetitionDetail/CompetitionDetailPage.tsx
    ├── HostCompetitionPage.tsx
    ├── PublicCompetitionPage.tsx
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
| `fetchCompetitionModuleStatus()` | GET | `/v1/competitions` |
| `fetchCompetitions()` | GET | `/v1/competitions/list` |
| `fetchCompetitionDetail(id)` | GET | `/v1/competitions/{id}` |
| `saveCompetitionDraft(payload)` | POST | `/v1/competitions/draft` |
| `publishCompetition(payload)` | POST | `/v1/competitions` |


