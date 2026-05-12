"""Transactional email delivery — SMTP (Brevo/Gmail/any provider)."""

from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings

logger = logging.getLogger("deltalabs.email")


async def send_otp_email(*, to: str, code: str, purpose: str) -> None:
    """Send a 6-digit OTP code via SMTP.

    Supports Brevo, Gmail, or any SMTP provider configured in settings.
    purpose: "signup" | "recover"
    """
    settings = get_settings()

    # Support both Brevo (preferred) and Gmail fallback
    smtp_host = settings.smtp_host
    smtp_port = settings.smtp_port
    smtp_user = settings.smtp_user
    smtp_password = settings.smtp_password
    from_address = settings.smtp_from_address

    if not smtp_user or not smtp_password:
        logger.warning(
            "email.smtp_not_configured — skipping delivery",
            extra={"to": to, "purpose": purpose},
        )
        return

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
            <div style="background:#f0f4f8;border-radius:8px;padding:20px 40px;
                        display:inline-block">
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

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.email_from_name} <{from_address}>"
    msg["To"] = to
    # Plain text fallback — helps avoid spam filters
    plain = f"Your DeltaLabs code is: {code}\n\nExpires in 5 minutes. Do not share."
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                server.login(smtp_user, smtp_password)
                server.sendmail(from_address, to, msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.ehlo()
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(from_address, to, msg.as_string())
        logger.info("email.sent", extra={"to": to, "purpose": purpose})
    except Exception as exc:
        logger.error(
            "email.send_failed",
            extra={"to": to, "purpose": purpose, "error": str(exc)},
        )
        if settings.env == "production":
            raise
