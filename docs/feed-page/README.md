# Feed feature documentation (Web + Backend)

Documentation for the **Feed / FYP (For You Page)** vertical in Delta Labs — **web frontend** and **backend** only (not mobile).

| Document | Contents |
|----------|----------|
| [feed-system-architecture.md](./feed-system-architecture.md) | End-to-end system design, architecture choices, request flows |
| [feed-backend-design.md](./feed-backend-design.md) | Backend services, API boundary, Redis pipeline, WebSocket |
| [feed-backend-data-model-and-diagrams.md](./feed-backend-data-model-and-diagrams.md) | MongoDB collections, indexes, ER-style diagrams |
| [feed-ranking-algorithms.md](./feed-ranking-algorithms.md) | Personalization / ranking algorithm decisions and formulas |
| [feed-user-flows.md](./feed-user-flows.md) | What users can do — journey diagrams and walkthroughs |
| [feed-frontend-component-hierarchy.md](./feed-frontend-component-hierarchy.md) | Detailed frontend component tree (primitives → views; logical layers only) |
| [feed-frontend-component-hierarchy-simple.md](./feed-frontend-component-hierarchy-simple.md) | Simplified layered component diagram |

**Related (implementation inventory, not AU-style diagrams):**

- `deltalabs-frontend/docs/feed-implementation-task-report.md`
- `BACKEND_FEED_FYP_ARCHITECTURE.md` (repo root — product/architecture notes)

**Source of truth (code):**

- Backend: `deltalabs-backend/app/api/v1/feed.py`, `app/domain/content/*`, `app/domain/engagement/*`
- Frontend: `deltalabs-frontend/src/modules/Feed/*`, `src/components/features/feed/*`, `src/modules/Search/views/SearchResultsView.tsx`

All diagrams use **Mermaid** — copy the fenced ` ```mermaid ` blocks into Markdown viewers, Notion, GitHub, or [mermaid.live](https://mermaid.live).
