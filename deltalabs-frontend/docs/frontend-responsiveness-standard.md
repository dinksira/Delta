# Delta Labs Frontend Responsiveness Standard

## Purpose

This document defines a single, enforceable responsiveness standard for frontend surfaces, with special focus on Landing/Feed consistency across browser widths and zoom levels (100%, 110%, 125%, 150%).

Use this with:
- `rule.md` (coding standards)
- `docs/frontend-architecture.md` (structure and ownership)

---

## Mobile-first implementation order (mandatory)

Build from **small viewports first**, then widen. Apply the same order in every layer:

1. **`src/styles/design-tokens.css` + `src/theme/designTokens.ts`** — colors, spacing, **layout tokens** (`--dl-layout-*`). No one-off magic numbers for shell rails, feed frame, or shared max widths.
2. **`src/components/theme/`** — primitives default to fluid width in a column, `min-w-0` where flex/grid children shrink, breakpoint variants only when **structure** changes.
3. **`src/components/features/**`** — compose primitives; one primary scroll owner per axis; use layout tokens for repeated dimensions.
4. **Layouts & shells** (`TopNav`, `FeedExplorerShell`, `AppShell`, school shells) — compact vs expanded behavior, rail collapse, overflow menus.
5. **Module views + thin `app/**/page.tsx`** — orchestration only; avoid new fixed widths unless they reference tokens.

Tailwind unprefixed classes are the **mobile base**; `sm:`, `md:`, `lg:` add behavior at larger **min-widths**. Prefer `clamp()` / `min()` / `calc(100vw - …)` before adding breakpoints.

---

## Layout tokens (`--dl-layout-*`)

Defined in `src/styles/design-tokens.css`. Reference in Tailwind with arbitrary values, e.g. `max-w-[var(--dl-layout-shell-rail-aside-cap)]`, or in inline `style` for non-Tailwind expressions.

| Token | Role |
|-------|------|
| `--dl-layout-shell-rail-min` / `--dl-layout-shell-rail-max` | Grid track range for explorer/nav side columns |
| `--dl-layout-shell-rail-aside-cap` | Max width of sticky side asides (search rail, right column, nav zones) |
| `--dl-layout-school-icon-rail-width` / `--dl-layout-school-icon-rail-overlap` | School icon rail width and optical overlap |
| `--dl-layout-features-page-max` | Features hub max content width (1440px) |
| `--dl-layout-feed-comment-sheet-max` | Comment sheet max width (aligns with `max-w-md`) |
| `--dl-layout-feed-video-*` | Landing feed portrait frame (`clamp` inputs + vw inset) |

**Rule:** If two components share a layout number, it must be a token — not duplicated literals.

Programmatic access (when needed): `designTokens.layout` in `src/theme/designTokens.ts` mirrors these CSS variables.

---

## Breakpoints (Tailwind Default)

Use Tailwind default breakpoints consistently:

- `sm`: `640px`
- `md`: `768px`
- `lg`: `1024px`
- `xl`: `1280px`
- `2xl`: `1536px`

Rules:
- Do not invent custom ad-hoc breakpoints in components.
- Prefer fluid sizing (`clamp`, `min`, `max`) before breakpoint jumps.
- Add breakpoint overrides only when a clear UX/layout requirement exists.

---

## Zoom-Resilient Layout Rules

Browser zoom changes the effective viewport. To avoid broken layouts:

1. Avoid hard paired jumps like `380px` -> `420px` only at one breakpoint.
2. Prefer fluid sizing with bounded constraints:
   - `width: clamp(min, preferred, max)`
3. Bound with viewport-aware max width:
   - `max-width: calc(100vw - reserved-space)`
4. Keep media aspect ratio explicit (`aspect-[9/16]`, etc.).
5. Reserve side space for rails/panels as explicit constants.

---

## Feed / Landing Standard (Mandatory)

### Video frame behavior

- Portrait media cards must keep `9:16` ratio.
- Frame width must be fluid and bounded (not single fixed pixel width).
- Frame width should be derived from viewport height when possible (desktop feed), then capped by viewport width.

Current approved feed frame strategy (implemented via CSS variables; change tokens, not scattered literals):

- Width: `clamp(var(--dl-layout-feed-video-width-min), var(--dl-layout-feed-video-width-preferred), var(--dl-layout-feed-video-width-max))` where preferred is `(100dvh - trim) * 0.5625`
- Max width: `calc(100vw - var(--dl-layout-feed-video-vw-inset))`
- Aspect ratio: `9/16` (on `FeedCard` / viewport)

### Loading parity

- Loading skeleton must use the same frame-sizing rule as live feed.
- Action rail placeholders must align with final rail spacing and hit zones.

### Action rail

- Rail button size and vertical spacing must stay constant across loading/live states.
- Rail must not overlap frame due to zoom; account for side reserve in frame max width.

---

## Component-Level Responsiveness Rules

### Containers

- Use `min-w-0` on flex children that can shrink.
- Use overflow controls deliberately (`overflow-x-hidden`, `overflow-y-auto`) at shell boundaries only.
- Avoid nesting multiple scroll containers for the same axis unless required.

### Typography and spacing

- Keep token-driven spacing and typography; do not hardcode random values.
- For small interactive controls, preserve minimum touch target size.

### Inputs and composers

- Text inputs that support multiline composition should grow with content up to a max height.
- After max height, input must scroll internally instead of pushing layout.

---

## Responsive QA Checklist (Required)

For Landing/Feed changes, verify at minimum:

1. Widths: `1280`, `1024`, `768`, `640`, `390`
2. Zoom: `100%`, `110%`, `125%`, `150%`
3. States:
   - loading
   - populated feed
   - comment panel open
   - auth modal/sheet open
4. Checks:
   - frame remains centered and consistent
   - action rail aligned and visible
   - no horizontal overflow
   - no clipped controls
   - no overlap between frame/rail/comment panel

---

## Change Control

If a team member changes feed frame formula, they must:

1. Update **`design-tokens.css`** layout tokens and this document.
2. Keep loading and live frame formulas identical.
3. Include before/after screenshots at multiple zoom levels in PR notes.

