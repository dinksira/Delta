# Public **database documentation** — how to organize it

This guide is **only** about a **public, online “Database” (or “Data platform”) documentation section** — not your marketing homepage, not product feature tutorials. Think: a subtree of your docs site, e.g. `/docs/database/…` or a workspace titled **Database documentation** that is **world-readable**.

**Repo sources to mirror (sanitized):**

- Plain language: `deltalabs-backend/docs/database-executive-summary.md`
- Full technical: `deltalabs-backend/docs/database.md`
- Internal portal layout ideas: `docs/information-architecture-portal.md`

---

## Recommended folder tree (public database docs only)

Use **numbered or ordered folders** so readers land in the right order. Names can match your Admin Portal or static site.

```text
Database documentation/                    ← root of this public section only
├── 01 Overview for all readers/
├── 02 Architecture and data stores/
├── 03 What we store today (inventory)/
├── 04 How data moves (flows)/
├── 05 Reference — MongoDB/
├── 06 Reference — Redis/
├── 07 Design decisions and operations/
└── 08 Changelog (database-related)/
```

**Optional:** flatten to fewer folders by merging `05–06` into **Reference** with two subpages.

---

## What each folder should contain

| Folder | Audience | Put here (from repo) | Public-safe rules |
|--------|----------|----------------------|-------------------|
| **01 Overview** | Everyone | Short intro: why Mongo + Redis; link “technical readers go to 05–07”. Copy/adapt **`database-executive-summary.md`**. | No secrets; no internal hostnames. |
| **02 Architecture** | Everyone + technical | One simple diagram (app → Mongo → Redis). Short bullets from **`database.md` §1**. | Same; diagram only—no credentials. |
| **03 Inventory** | PM, security reviewers, engineers | Tables: collections by domain, Redis *categories* (streams, idempotency, OTP—not necessarily every key string if you want less recon detail). From **`database.md` §5**. | If you want minimal recon footprint, describe Redis as “streams for feed events”, “TTL keys for signup/OTP” **without** listing every key prefix; full list is optional for “fully transparent” public docs. |
| **04 Flows** | Engineers + technical PM | **`database.md` §10** (signup, feed like, school). | OK public; helps integrators understand behavior. |
| **05 Reference — MongoDB** | Engineers | **`database.md` §6** (dictionary + indexes), **§11** sample documents with **fake IDs only**. | Use `example.com`, obvious placeholder UUIDs; **never** real tokens or hashes. |
| **06 Reference — Redis** | Engineers | **`database.md` §7**. | Same sanitization; no production URLs. |
| **07 Design, performance, failures, evolution** | Engineers + architects | **`database.md` §12–§13**, **§14–§15** (extend + maintenance). | Remove any internal-only ops (specific vendor runbook URLs); keep behavior-level text. |
| **08 Changelog** | Everyone | One line per release: “Added X collection”, “New index for Y”. | No security-sensitive timing of unpatched issues until fixed. |

---

## Two public modes (pick one and stay consistent)

| Mode | What you publish under **05–06** |
|------|-------------------------------------|
| **Full transparency** | Full collection names, indexes, Redis key patterns (matches current `database.md`). Good for **open-by-design** APIs and trust with technical buyers. |
| **Softer public reference** | Architecture + inventory at **category** level; move **exact key names and every index name** to **authenticated** developer docs only. Good if security review prefers less surface detail. |

You said you want **public database documentation** — **either mode is valid**; align with your org’s security review.

---

## What must never appear (even in public database docs)

- Connection strings, passwords, API keys, private keys  
- Production hostnames, internal VPC endpoints, non-public admin URLs  
- Real user records, real session material, production stack traces  
- Employee-only runbooks (on-call phone trees, etc.) — keep in internal wiki  

---

## Mapping from your internal portal folders

If you already use **`00 For everyone` / `10 Architecture` / `20 Engineering`** internally, the **public database** section maps cleanly:

| Internal | Public database section |
|----------|---------------------------|
| `00 For everyone` | **01 Overview** (and first part of **02** if very short) |
| `10 Architecture` | **02** + **03** + **04** (trim wording for web if needed) |
| `20 Engineering` | **05**, **06**, **07** |
| Changelog slice | **08** |

---

## Checklist before publishing this section

- [ ] Every JSON example uses fake identities and `example.com`  
- [ ] No `.env` or copy-paste from real config  
- [ ] “Last updated” or version on the overview page  
- [ ] Clear link: “Non-technical: read 01–03 only” / “Engineers: 04–07”  

---

*Scope: public **database** documentation organization only — not homepage or full product docs site.*
