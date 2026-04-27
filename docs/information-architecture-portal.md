# Documentation portal — Database area (folders for everyone vs engineers)

Use this layout in your **Admin Portal** (or any docs site with folders and pages). The idea is simple: **non-technical readers never open the engineering tree**, or they only open the first folder.

---

## Recommended top-level structure under “Database” (or “Data & storage”)

```text
Database (workspace)
├── 00 — For everyone (plain language)
├── 10 — Architecture (still mostly plain language + one diagram)
├── 20 — Engineering (technical reference)
└── 30 — Operations & change log (mixed: short notes for everyone, detail for engineers)
```

---

## Folder `00 — For everyone`

**Goal:** Anyone at the company can read this without knowing MongoDB, Redis, or FastAPI.

| Page title | What to put on the page | Source to copy or adapt |
|------------|-------------------------|---------------------------|
| **What data does DeltaLabs use?** | Filing-cabinet vs sticky-notes analogy; table “what we store” in plain English | `deltalabs-backend/docs/database-executive-summary.md` |
| **Who should read which doc?** | 3 bullets: executives/read `00`; tech leads skim `10` + link `20`; engineers own `20` | This file (section below) |
| **Privacy & retention (high level)** | What categories exist; “passwords are hashed”; “sessions expire”; link to legal if you have a DPA | Write with legal/compliance; keep non-technical |

**Do not** paste long JSON, index names, or Redis key patterns in `00` — that pushes non-technical readers away.

---

## Folder `10 — Architecture`

**Goal:** Still readable for motivated non-technical people; **one diagram**, short bullets.

| Page title | Audience | Source |
|------------|----------|--------|
| **Big picture: app → data stores** | Everyone + tech | First diagram + 1 short paragraph from `database.md` §1 |
| **What we have today (inventory)** | PM + tech | `database.md` §5 only (the tables — you can simplify column headers to “Area / What we store”) |
| **Main user journeys (data view)** | PM + tech | `database.md` §10 — keep diagrams; add one plain sentence under each: “Signup uses Redis until the account is saved in MongoDB.” |

Optional: add **glossary** page (“MongoDB = document database”, “Redis = in-memory with expiry”) — still in `10`, not in `00`.

---

## Folder `20 — Engineering`

**Goal:** Developers and DevOps only. **Full accuracy**; can be long.

| Page title | Source (`database.md`) |
|------------|-------------------------|
| How we connect (Mongo + Redis lifecycle) | §2–§4 |
| Configuration (non-secret) | §4 |
| Full inventory + code paths | §5 |
| Data dictionary (indexes) | §6 |
| Redis catalog | §7 |
| Core data flows (detailed) | §10 |
| Sample documents | §11 |
| Modeling decisions | §12 |
| Performance, failures, schema evolution | §13 |
| Extensions + index maintenance | §14–§15 |

You can split `20` into subfolders if you like: **Connection**, **MongoDB**, **Redis**, **Flows**, **Reference**.

---

## Folder `30 — Operations & change log`

**Goal:** Short **change log** entries everyone can understand (“April 2026: added school offers storage”) plus links to engineering pages for **how**.

| Page title | Audience |
|------------|----------|
| **What changed (changelog)** | Everyone — one sentence per release |
| **Backups and access (policy)** | Ops + leadership summary; link to internal runbook |

---

## One-page “how to use this documentation” (for folder `00`)

You can paste this on the first page in `00`:

1. **I am not technical** — read only **`00 — For everyone`**, then **`10 — Architecture`** if you need journeys or the big picture.  
2. **I am technical** — skim **`10`**, then use **`20 — Engineering`** as the canonical reference; edit **`database.md`** in Git when the system changes, then refresh portal pages from it.  
3. **I need compliance detail** — start in **`00`**, then work with engineering for **`20`** sections on flows and samples.

---

## Summary

| Folder | Non-technical clarity |
|--------|---------------------|
| **00** | **Yes** — purpose-built short copy (`database-executive-summary.md`). |
| **10** | **Mostly** — diagrams + short explanations; avoid index dumps. |
| **20** | **No** — this is for engineers; that is intentional. |
| **30** | **Changelog yes**; deep ops maybe not for everyone. |

---

*Repo paths: plain-language summary `deltalabs-backend/docs/database-executive-summary.md`; technical reference `deltalabs-backend/docs/database.md`.*
