# `deltalabs-explanation/`

This directory **mirrors the `app/` folder layout**. Each markdown file sits in the **same relative path** as the Python module it describes, with the name **`basename.md`** matching **`basename.py`** (for example `service.md` explains `app/domain/identity/service.py`).

**Scope (authentication only):**

| Mirror path | Source |
|-------------|--------|
| `app/api/v1/auth.md` | `app/api/v1/auth.py` |
| `app/domain/identity/*.md` | `app/domain/identity/*.py` |
| `app/core/security.md` | `app/core/security.py` (password + session token helpers used by identity) |

Open `app/domain/identity/README.md` for a package index and frontend cross-links.
