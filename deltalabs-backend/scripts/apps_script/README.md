# Temporary Gmail email via Google Apps Script

Use this until you have a verified domain on Resend. Sends from the Google account that owns the script.

## Setup (about 5 minutes)

1. Open [Apps Script](https://script.google.com/home) → **New project**.
2. Replace `Code.gs` with `DeltaLabsSendEmail.gs` from this folder.
3. **Project settings** (gear) → **Script properties** → Add property:
   - Name: `EMAIL_SECRET`
   - Value: a long random string (e.g. from a password generator)
4. **Deploy** → **New deployment** → type **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the **Web app URL** (must end with `/exec`).

## Render environment variables

```env
EMAIL_PROVIDER=apps_script
APPS_SCRIPT_EMAIL_URL=https://script.google.com/macros/s/XXXX/exec
APPS_SCRIPT_EMAIL_SECRET=same-as-EMAIL_SECRET-above
EMAIL_FROM_NAME=DeltaLabs
```

Redeploy the API service.

## Test

```bash
curl -X POST "$APPS_SCRIPT_EMAIL_URL" \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_SECRET","to":"you@gmail.com","subject":"Test","htmlBody":"<p>Hello</p>","fromName":"DeltaLabs"}'
```

Expected: `{"ok":true}` and an email in the inbox.

## Remove later

When Resend has a verified domain:

1. Set `EMAIL_PROVIDER=resend` and `RESEND_*` on Render.
2. Delete the Apps Script deployment (optional).
