# `app/domain/identity/` (package index)

Python package for **users, password hashes, sessions**, and orchestration for **multi-step signup**, **OTP verification**, and **password recovery**. Durable data in **MongoDB**; ephemeral OTP/flow/recover state in **Redis**.

## One markdown file per module

| Source file | Explanation |
|-------------|-------------|
| `__init__.py` | [`__init__.md`](__init__.md) |
| `schemas.py` | [`schemas.md`](schemas.md) |
| `repository.py` | [`repository.md`](repository.md) |
| `service.py` | [`service.md`](service.md) |
| `signup_flow_service.py` | [`signup_flow_service.md`](signup_flow_service.md) |
| `verification_service.py` | [`verification_service.md`](verification_service.md) |
| `recover_service.py` | [`recover_service.md`](recover_service.md) |

## Frontend touchpoints

| Area | Frontend |
|------|----------|
| `Service` (login, session, logout, `signup_init`) | `authApi.login`, session read, logout when wired |
| `SignupFlowService` + `VerificationService` | `SignupPageView`, `authApi.sendSignupVerification`, `authApi.signup` step chain |
| `RecoverService` | `RecoverPageView`, recover mutations / `authApi` |

## Related (outside this package)

- HTTP entry: [`../../api/v1/auth.md`](../../api/v1/auth.md) ↔ `app/api/v1/auth.py`
- Crypto helpers: [`../../core/security.md`](../../core/security.md) ↔ `app/core/security.py`
