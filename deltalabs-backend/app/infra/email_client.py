"""Transactional email delivery via Resend (HTTPS — works on all cloud providers)."""

from __future__ import annotations

import logging

import resend

from app.core.config import get_settings

logger = logging.getLogger("deltalabs.email")


def configure_resend() -> None:
    """Set the Resend API key from settings (called once at startup)."""
    settings = get_settings()
    if settings.resend_api_key:
        resend.api_key = settings.resend_api_key


async def send_otp_email(*, to: str, code: str, purpose: str) -> bool:
    """Send a 6-digit OTP code via Resend.

    Uses HTTPS — not blocked by any cloud provider (unlike SMTP).
    purpose: "signup" | "recover"

    Returns True when the provider accepted the send request.
    """
    settings = get_settings()

    if not settings.resend_api_key:
        logger.warning(
            "email.resend_api_key_missing — skipping delivery",
            extra={"to": to, "purpose": purpose},
        )
        return False

    subject_map = {
        "signup": "Your DeltaLabs verification code",
        "recover": "Reset your DeltaLabs password",
    }
    subject = subject_map.get(purpose, "Your DeltaLabs code")

    html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;padding:40px;
                    box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr>
          <td style="padding-bottom:24px;border-bottom:1px solid #eee">
            <h1 style="margin:0;color:#1A3C4D;font-size:24px">DeltaLabs</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 0 16px">
            <p style="margin:0;color:#444;font-size:15px;line-height:1.6">
              {"Use the code below to verify your account." if purpose == "signup"
               else "Use the code below to reset your password."}
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:16px 0 32px">
            <div style="background:#f0f4f8;border-radius:8px;padding:20px 40px">
              <span style="font-size:40px;font-weight:700;letter-spacing:10px;
                           color:#1A3C4D;font-family:monospace">{code}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:24px">
            <p style="margin:0;color:#888;font-size:13px;line-height:1.6">
              This code expires in <strong>5 minutes</strong>.
              Do not share it with anyone.
            </p>
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid #eee;padding-top:24px">
            <p style="margin:0;color:#bbb;font-size:12px">
              If you did not request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    params: resend.Emails.SendParams = {
        "from": f"{settings.email_from_name} <{settings.resend_from_address}>",
        "to": [to],
        "subject": subject,
        "html": html_body,
    }

    try:
        result = resend.Emails.send(params)
        logger.info(
            "email.sent",
            extra={"to": to, "purpose": purpose, "id": result.get("id")},
        )
        return True
    except Exception as exc:
        logger.error(
            "email.send_failed",
            extra={"to": to, "purpose": purpose, "error": str(exc)},
        )
        return False
