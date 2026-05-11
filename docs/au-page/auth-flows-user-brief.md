# Login, signup, and account recovery — brief

One narrative per flow: what you do, what you see, and how the app handles passwords, codes, tokens, and session—without a separate “technical layer.” For API sequences and diagrams, see `auth-feature-flows-au.md`.

---

## Where these flows appear

- **Full pages:** `/login` and `/signup`.
- **Same UI as a modal:** URLs like `/?auth=login`, `/?auth=signup`, or `/?auth=recover`. Closing the modal clears the `auth` query param.

---

## Login

You want to sign in with **email or phone** plus **password**, optional **Remember me**, and you can open **Forgot password** if needed.

**What you do:** open Login (page or modal), fill identity and password, submit.

**What happens end-to-end:** the app validates the form, then calls the server over **HTTPS** with **identity + password** (password never goes in the URL). The server looks up your account and checks the password by comparing a **one-way hash** (we use **scrypt** with a salt in MongoDB)—your plain password is **not** stored on disk. If credentials are wrong, you get field errors or a top **banner**. If they match, the server creates a **session** in the database and returns an **access token** (opaque string), **who you are**, and an **expiry** (`expiresAt`).

The browser then saves a small session bundle under **`dl.auth.session.v1`** in **localStorage** (token + user + expiry). **`AuthSessionProvider`** reads it early so the UI does not flash logged-out. **`apiClient`** attaches **`Authorization: Bearer <token>`** on later API calls. A separate cookie **`dl_session=1`** is only a **“signed in, yes/no”** flag for **Next.js middleware** on protected routes—the **token itself stays out of the cookie**. If the stored session is missing or past expiry, you are treated as signed out. **Remember me** is shown on the form; today the login request body is still **identity + password** only, so how long you stay signed in is mainly whatever **`expiresAt`** the server returns.

**What we use:** `LoginPageView`, shared auth fields/shell, `POST /v1/auth/login`, session persistence in `AuthSession_Context.tsx` + `apiClient.ts`, cookie name from `lib/authSession.ts` (`dl_session`).

---

## Signup (create account)

You want a **guided path**: who you are → date of birth → phone and email → **verification code** → password → account created.

**What you do:** step through the card with **Next** / **Continue** / **Create account**; use **Back** where the UI allows.

**What happens end-to-end:** each step validates before moving on. After contact is saved, the server issues a **verification** challenge; state for signup steps and codes lives in **Redis** with **TTL** and **rate limits** (not the same as your long-lived **access token** after login—codes only prove you passed that step). When you set your password at the end, it is sent over **HTTPS** and stored as a **hash** like login, not plain text. Completing signup returns the same kind of **access token + session payload** as login; the browser stores it under **`dl.auth.session.v1`**, sets **`dl_session`**, and attaches **Bearer** on API calls—same session picture as login. **Real SMS/email delivery is not fully wired** for production yet; in local/dev you may see a **`debug_code`** to test OTP.

**What we use:** `SignupPageView`, verification send/complete APIs, Redis-backed flow state on the backend, MongoDB for durable user data, same session stack as login after success.

---

## Account recovery (forgot / reset password)

You want to prove you control the account, then set a **new** password.

**What you do:** (1) **Recover** — enter email or phone; (2) **Reset** — enter the **one-time code**, new password, confirm; (3) **Done** — message, then **Go to login** with the new password.

**What happens end-to-end:** recovery and OTP-style data sit in **Redis** with expiry and attempt limits. Messaging avoids telling strangers whether an identity exists. The new password is **hashed** and saved like signup/login; old **sessions can be revoked** so previous tokens stop working. You typically **sign in again** from the login screen (fresh token), using the same **localStorage + Bearer + `dl_session`** pattern as login once you submit credentials.

**What we use:** `RecoverPageView`, recover/reset endpoints, Redis + MongoDB, same auth shell as other flows.

---

## One-line comparison

| Flow    | User goal          | Typical outcome                               |
|---------|--------------------|-----------------------------------------------|
| Login   | Sign in            | Session + token; enter the app                |
| Signup  | Create account     | Verify contact → password → session + token   |
| Recover | Replace password   | Reset complete → sign in again with new password |

---

## Related docs

- Detailed flows (sequences, stores): `docs/au-page/auth-feature-flows-au.md`
- Architecture diagrams: `docs/au-page/system-flow-diagram.md`, `docs/au-page/backend-design-diagram.md`
- Slide-style diagram notes: `docs/au-page/diagram-explanations.md`
