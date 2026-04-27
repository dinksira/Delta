"""Generate Postman Collection v2.1 JSON for all API routes."""

from __future__ import annotations

import json
import uuid
from pathlib import Path


def hdr(key: str, value: str, *, enabled: bool = True) -> dict:
    return {"key": key, "value": value, "type": "text", "disabled": not enabled}


def build_url(path: str, query: list[tuple[str, str]] | None = None) -> dict:
    """path starts with / (no baseUrl)."""
    # ################################ MODULE ################################
    raw = "{{baseUrl}}" + path
    if query:
        raw += "?" + "&".join(f"{k}={v}" for k, v in query)
    segments = [s for s in path.strip("/").split("/") if s]
    url: dict = {"raw": raw, "host": ["{{baseUrl}}"], "path": segments}
    if query:
        url["query"] = [{"key": k, "value": v} for k, v in query]
    return url


def req(
    name: str,
    method: str,
    path: str,
    *,
    desc: str = "",
    body: dict | None = None,
    query: list[tuple[str, str]] | None = None,
    auth_bearer: bool = False,
    idem: bool = False,
    accept: str = "application/json",
    test_script: list[str] | None = None,
) -> dict:
    headers = [
        hdr("Content-Type", "application/json", enabled=body is not None),
        hdr("Accept", accept, enabled=True),
        hdr("X-Request-Id", "{{$guid}}", enabled=False),
    ]
    if auth_bearer:
        headers.append(hdr("Authorization", "Bearer {{access_token}}", enabled=True))
    if idem:
        headers.append(hdr("Idempotency-Key", "{{$guid}}", enabled=False))

    r: dict = {
        "method": method,
        "header": headers,
        "url": build_url(path, query),
        "description": desc,
    }
    if body is not None:
        r["body"] = {
            "mode": "raw",
            "raw": json.dumps(body, indent=2),
            "options": {"raw": {"language": "json"}},
        }
    item: dict = {"name": name, "request": r, "response": []}
    if test_script:
        item["event"] = [
            {"listen": "test", "script": {"exec": test_script, "type": "text/javascript"}}
        ]
    return item


def folder(name: str, desc: str, items: list) -> dict:
    return {"name": name, "description": desc, "item": items}


# Postman **Tests** tab: auto-fill collection variables on success
TS_SAVE_ACCESS_TOKEN = [
    "if (pm.response.code === 200) {",
    "  try {",
    "    var j = pm.response.json();",
    '    if (j.access_token) { pm.collectionVariables.set("access_token", j.access_token); }',
    "  } catch (e) {}",
    "}",
]
TS_SAVE_VERIFICATION_ID = [
    "if (pm.response.code === 200) {",
    "  try {",
    "    var j = pm.response.json();",
    "    if (j.verification_id) {",
    '      pm.collectionVariables.set("verification_id", j.verification_id);',
    "    }",
    "  } catch (e) {}",
    "}",
]
TS_SAVE_FLOW_ID = [
    "if (pm.response.code === 200) {",
    "  try {",
    "    var j = pm.response.json();",
    '    if (j.flow_id) { pm.collectionVariables.set("flow_id", j.flow_id); }',
    "  } catch (e) {}",
    "}",
]
TS_SAVE_RECOVER_ID = [
    "if (pm.response.code === 200) {",
    "  try {",
    "    var j = pm.response.json();",
    '    if (j.recover_id) { pm.collectionVariables.set("recover_id", j.recover_id); }',
    "  } catch (e) {}",
    "}",
]
TS_SAVE_RESET_TOKEN = [
    "if (pm.response.code === 200) {",
    "  try {",
    "    var j = pm.response.json();",
    '    if (j.reset_token) { pm.collectionVariables.set("reset_token", j.reset_token); }',
    "  } catch (e) {}",
    "}",
]
TS_SAVE_FIRST_FEED_ITEM_ID = [
    "if (pm.response.code === 200) {",
    "  try {",
    "    var j = pm.response.json();",
    "    if (j.items && j.items.length && j.items[0].id) {",
    '      pm.collectionVariables.set("item_id", j.items[0].id);',
    "    }",
    "  } catch (e) {}",
    "}",
]


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    out = root / "postman" / "Delta-Labs-API.postman_collection.json"
    out.parent.mkdir(parents=True, exist_ok=True)

    pfx = "/v1"

    info = {
        "name": "Delta Labs API (Complete)",
        "description": (
            "Complete collection for **deltalabs-backend** (FastAPI).\n\n"
            "### Collection variables\n"
            "- `baseUrl` — e.g. `http://localhost:8000` (no trailing slash; default uvicorn)\n"
            "- `access_token` — paste from `POST .../login` or `POST .../signup/complete` "
            "(requests add `Bearer `)\n"
            "- `flow_id`, `verification_id`, `recover_id`, `reset_token`, "
            "`item_id`, `feature_key` — shortcuts for path/body\n\n"
            "### Optional headers\n"
            "- `X-Request-Id` — echoed on the response\n"
            "- `Idempotency-Key` — enable on feed engagement POSTs for safe retries "
            "(echoed when sent)\n\n"
            "### Auth\n"
            "Protected routes need `Authorization: Bearer <access_token>` "
            "(opaque string from login/signup responses).\n\n"
            "### Errors\n"
            "JSON envelope: `code`, `message`, `requestId`, `details`.\n\n"
            "### Rate limits\n"
            "`POST /v1/auth/*` may return **429** (`code: rate_limited`) per IP/minute; "
            "see env `RATE_LIMIT_AUTH_POSTS_PER_MINUTE`.\n\n"
            "### Readiness\n"
            "`GET /ready` returns **503** if MongoDB or Redis is unavailable.\n\n"
            "### Config\n"
            "If `API_V1_PREFIX` in `.env` is not `/v1`, update every `/v1/...` path (or add a "
            "`apiPrefix` variable). Default idempotency header name: `Idempotency-Key` "
            "(`IDEMPOTENCY_HEADER_NAME`).\n\n"
            "### Tests scripts\n"
            "Several requests run a **Tests** script that saves IDs/tokens to "
            "collection variables on 200."
        ),
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        "_postman_id": str(uuid.uuid4()),
    }

    variables = [
        {"key": "baseUrl", "value": "http://localhost:8000"},
        {"key": "access_token", "value": ""},
        {"key": "org_id", "value": "delta-labs"},
        {"key": "school_id", "value": "school-1"},
        {"key": "lab_id", "value": "lab-1"},
        {"key": "flow_id", "value": ""},
        {"key": "verification_id", "value": ""},
        {"key": "recover_id", "value": ""},
        {"key": "reset_token", "value": ""},
        {"key": "item_id", "value": "demo-feed-1"},
        {"key": "feature_key", "value": "school"},
    ]

    health = folder(
        "00 — Health & readiness (root)",
        "No `/v1` prefix.",
        [
            req(
                "GET Liveness /health",
                "GET",
                "/health",
                desc='200: `{"status":"ok"}`.',
            ),
            req(
                "GET Readiness /ready",
                "GET",
                "/ready",
                desc=(
                    "200 + `status: ready` if Mongo+Redis OK; 503 + `not_ready` + `checks` if not."
                ),
            ),
        ],
    )

    sysf = folder(
        "01 — V1 System",
        "",
        [
            req("GET System status", "GET", f"{pfx}/system/status"),
            req(
                "GET Metrics",
                "GET",
                f"{pfx}/system/metrics",
                desc="`requests_total`, `responses_by_status`.",
            ),
        ],
    )

    auth_folder = folder(
        "02 — Auth",
        "Two signup paths: (1) `signup/init` legacy. (2) Step flow: identity → contact → "
        "OTP via `/verification/*` → step/verification → dob → complete.",
        [
            req(
                "POST signup/init (legacy)",
                "POST",
                f"{pfx}/auth/signup/init",
                body={
                    "username": "newuser123",
                    "email": "user@example.com",
                    "phone_e164": None,
                    "password": "LongPassword!234",
                },
                desc="Password min 10 chars. Returns `access_token`, `session`, `user`.",
                test_script=TS_SAVE_ACCESS_TOKEN,
            ),
            req(
                "POST login",
                "POST",
                f"{pfx}/auth/login",
                body={"identity": "newuser123", "password": "LongPassword!234"},
                desc="`identity` = username, email, or phone.",
                test_script=TS_SAVE_ACCESS_TOKEN,
            ),
            req(
                "GET session",
                "GET",
                f"{pfx}/auth/session",
                auth_bearer=True,
                desc="Current session + user.",
            ),
            req(
                "POST logout",
                "POST",
                f"{pfx}/auth/logout",
                auth_bearer=True,
            ),
            req(
                "POST verification/send",
                "POST",
                f"{pfx}/auth/verification/send",
                body={
                    "channel": "email",
                    "destination": "user@example.com",
                    "purpose": "signup",
                },
                desc="`channel` 3–16 chars. Local may return `debug_code`.",
                test_script=TS_SAVE_VERIFICATION_ID,
            ),
            req(
                "POST verification/verify",
                "POST",
                f"{pfx}/auth/verification/verify",
                body={"verification_id": "{{verification_id}}", "code": "000000"},
            ),
            req(
                "POST verification/resend",
                "POST",
                f"{pfx}/auth/verification/resend",
                body={"verification_id": "{{verification_id}}"},
            ),
            req(
                "POST signup/step/identity",
                "POST",
                f"{pfx}/auth/signup/step/identity",
                body={"username": "flowuser456"},
                desc="Response includes `flow_id` → copy to collection variable.",
                test_script=TS_SAVE_FLOW_ID,
            ),
            req(
                "POST signup/step/contact",
                "POST",
                f"{pfx}/auth/signup/step/contact",
                body={
                    "flow_id": "{{flow_id}}",
                    "email": "flowuser456@example.com",
                    "phone_e164": None,
                },
                desc="At least one of email or phone_e164.",
            ),
            req(
                "POST signup/step/verification",
                "POST",
                f"{pfx}/auth/signup/step/verification",
                body={
                    "flow_id": "{{flow_id}}",
                    "verification_id": "{{verification_id}}",
                },
            ),
            req(
                "POST signup/step/dob",
                "POST",
                f"{pfx}/auth/signup/step/dob",
                body={"flow_id": "{{flow_id}}", "date_of_birth": "1995-06-15"},
            ),
            req(
                "POST signup/complete",
                "POST",
                f"{pfx}/auth/signup/complete",
                body={"flow_id": "{{flow_id}}", "password": "LongPassword!234"},
                desc="Returns `access_token`.",
                test_script=TS_SAVE_ACCESS_TOKEN,
            ),
            req(
                "GET signup/state",
                "GET",
                f"{pfx}/auth/signup/state",
                query=[("flow_id", "{{flow_id}}")],
                desc="Required query: flow_id.",
            ),
            req(
                "POST recover/request",
                "POST",
                f"{pfx}/auth/recover/request",
                body={"identity": "user@example.com"},
                test_script=TS_SAVE_RECOVER_ID,
            ),
            req(
                "POST recover/verify",
                "POST",
                f"{pfx}/auth/recover/verify",
                body={"recover_id": "{{recover_id}}", "code": "000000"},
                test_script=TS_SAVE_RESET_TOKEN,
            ),
            req(
                "POST recover/reset",
                "POST",
                f"{pfx}/auth/recover/reset",
                body={
                    "recover_id": "{{recover_id}}",
                    "reset_token": "{{reset_token}}",
                    "new_password": "NewLongPass!234",
                },
            ),
        ],
    )

    orgs_folder = folder(
        "03 — Organizations",
        "Org lifecycle: create workspace, list my orgs, join org.",
        [
            req(
                "POST create org",
                "POST",
                f"{pfx}/orgs",
                auth_bearer=True,
                body={"name": "My First Org", "slug": "my-first-org"},
                test_script=[
                    "if (pm.response.code === 200) {",
                    "  try {",
                    "    var j = pm.response.json();",
                    '    if (j.org && j.org.id) pm.collectionVariables.set("org_id", j.org.id);',
                    "  } catch (e) {}",
                    "}",
                ],
            ),
            req(
                "GET my orgs",
                "GET",
                f"{pfx}/orgs/me",
                auth_bearer=True,
            ),
            req(
                "POST join org",
                "POST",
                f"{pfx}/orgs/{{{{org_id}}}}/join",
                auth_bearer=True,
            ),
        ],
    )

    feed = folder(
        "04 — Feed",
        "List/detail public. Writes need Bearer. Enable Idempotency-Key on POSTs when needed.",
        [
            req(
                "GET feed list",
                "GET",
                f"{pfx}/feed",
                query=[("limit", "12"), ("cursor", ""), ("content_type", "")],
                desc="limit 1–50; cursor from prior next_cursor; optional content_type filter. "
                "Tests script stores first `items[].id` into `item_id` when present.",
                test_script=TS_SAVE_FIRST_FEED_ITEM_ID,
            ),
            req(
                "GET feed item",
                "GET",
                f"{pfx}/feed/{{{{item_id}}}}",
            ),
            req(
                "POST like",
                "POST",
                f"{pfx}/feed/{{{{item_id}}}}/like",
                auth_bearer=True,
                idem=True,
            ),
            req(
                "POST save",
                "POST",
                f"{pfx}/feed/{{{{item_id}}}}/save",
                auth_bearer=True,
                idem=True,
            ),
            req(
                "POST comment",
                "POST",
                f"{pfx}/feed/{{{{item_id}}}}/comment",
                auth_bearer=True,
                idem=True,
                body={"body": "Great content!"},
            ),
            req(
                "POST share",
                "POST",
                f"{pfx}/feed/{{{{item_id}}}}/share",
                auth_bearer=True,
                idem=True,
            ),
            req(
                "POST enroll (placeholder)",
                "POST",
                f"{pfx}/feed/{{{{item_id}}}}/enroll",
                auth_bearer=True,
            ),
        ],
    )

    feat = folder(
        "05 — Features",
        "Bearer required.",
        [
            req("GET features list", "GET", f"{pfx}/features", auth_bearer=True),
            req(
                "GET feature by key",
                "GET",
                f"{pfx}/features/{{{{feature_key}}}}",
                auth_bearer=True,
            ),
        ],
    )

    org_scoped = folder(
        "06 — Org scoped RBAC routes",
        "Path-scoped authorization examples with `/v1/orgs/{org_id}/...`.",
        [
            req(
                "GET org features list",
                "GET",
                f"{pfx}/orgs/{{{{org_id}}}}/features",
                auth_bearer=True,
            ),
            req(
                "GET org feature by key",
                "GET",
                f"{pfx}/orgs/{{{{org_id}}}}/features/{{{{feature_key}}}}",
                auth_bearer=True,
            ),
            req(
                "GET org schools (stub)",
                "GET",
                f"{pfx}/orgs/{{{{org_id}}}}/schools",
                auth_bearer=True,
            ),
            req(
                "GET org labs (stub)",
                "GET",
                f"{pfx}/orgs/{{{{org_id}}}}/labs",
                auth_bearer=True,
            ),
        ],
    )

    stubs = [
        "schools",
        "courses",
        "enrollments",
        "planner",
        "certification",
        "chatroom",
        "tutorials",
        "research",
        "competitions",
        "specialization",
        "library",
        "course_support",
        "rent_lab",
        "help_support",
    ]
    stub_items = [
        req(
            f"GET stub /{m}",
            "GET",
            f"{pfx}/{m}",
            desc='{"status":"not_implemented","module":"..."}',
        )
        for m in stubs
    ]
    stub_folder = folder(
        "07 — Domain stubs",
        "Each returns not_implemented JSON until implemented.",
        stub_items,
    )

    openapi_folder = folder(
        "08 — OpenAPI & docs (FastAPI)",
        "Auto-generated by the framework; not under `/v1`.",
        [
            req(
                "GET OpenAPI schema (JSON)",
                "GET",
                "/openapi.json",
                desc="Full OpenAPI 3 schema — can import into Postman or codegen clients.",
            ),
            req(
                "GET Swagger UI",
                "GET",
                "/docs",
                accept="text/html,application/json;q=0.9,*/*;q=0.8",
                desc="Interactive docs (HTML). Best viewed in a browser.",
            ),
            req(
                "GET ReDoc",
                "GET",
                "/redoc",
                accept="text/html,application/json;q=0.9,*/*;q=0.8",
                desc="Alternative docs UI (HTML).",
            ),
        ],
    )

    collection = {
        "info": info,
        "variable": variables,
        "item": [
            health,
            sysf,
            auth_folder,
            orgs_folder,
            feed,
            feat,
            org_scoped,
            stub_folder,
            openapi_folder,
        ],
    }

    out.write_text(json.dumps(collection, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
# ################################ /MODULE ################################
