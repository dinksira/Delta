"""Transactional OTP email via Resend, SMTP, or temporary Google Apps Script relay."""

from __future__ import annotations

import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import parseaddr
from typing import Any, Literal, NamedTuple, cast

import httpx
import resend

from app.core.config import get_settings

logger = logging.getLogger("deltalabs.email")

EmailFailureReason = Literal["not_configured", "provider_rejected"]


class EmailSendResult(NamedTuple):
    """Outcome of an OTP email send attempt."""

    ok: bool
    failure_reason: EmailFailureReason | None = None
    failure_detail: str | None = None


def configure_resend() -> None:
    """Set the Resend API key from settings (called once at startup)."""
    settings = get_settings()
    if settings.resend_api_key:
        resend.api_key = settings.resend_api_key


def _subject_for_purpose(purpose: str) -> str:
    subject_map = {
        "signup": "Your DeltaLabs verification code",
        "recover": "Reset your DeltaLabs password",
    }
    return subject_map.get(purpose, "Your DeltaLabs code")


def _html_body_for_otp(*, purpose: str, code: str) -> str:
    return f"""<!DOCTYPE html>
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


def _log_delivery_failed(
    *,
    to: str,
    purpose: str,
    reason: EmailFailureReason,
    detail: str,
) -> None:
    logger.error(
        "email.delivery_failed",
        extra={"to": to, "purpose": purpose, "reason": reason, "detail": detail},
    )


async def _send_via_resend(*, to: str, subject: str, html_body: str, purpose: str) -> EmailSendResult:
    settings = get_settings()
    if not settings.resend_api_key:
        detail = "RESEND_API_KEY is not set"
        _log_delivery_failed(to=to, purpose=purpose, reason="not_configured", detail=detail)
        return EmailSendResult(ok=False, failure_reason="not_configured", failure_detail=detail)

    params: resend.Emails.SendParams = {
        "from": f"{settings.email_from_name} <{settings.resend_from_address}>",
        "to": [to],
        "subject": subject,
        "html": html_body,
    }
    try:
        result = resend.Emails.send(params)
        logger.info("email.sent", extra={"to": to, "provider": "resend", "id": result.get("id")})
        return EmailSendResult(ok=True)
    except Exception as exc:
        detail = str(exc)
        _log_delivery_failed(to=to, purpose=purpose, reason="provider_rejected", detail=detail)
        return EmailSendResult(ok=False, failure_reason="provider_rejected", failure_detail=detail)


def _smtp_send_sync(
    *,
    host: str,
    port: int,
    user: str,
    password: str,
    from_header: str,
    to: str,
    subject: str,
    html_body: str,
) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_header
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    with smtplib.SMTP(host, port, timeout=30) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(user, password)
        _, envelope_from = parseaddr(from_header)
        server.sendmail(envelope_from or user, [to], msg.as_string())


async def _send_via_smtp(*, to: str, subject: str, html_body: str, purpose: str) -> EmailSendResult:
    settings = get_settings()
    if not settings.smtp_user or not settings.smtp_password:
        detail = "SMTP_USER and SMTP_PASSWORD must be set when EMAIL_PROVIDER=smtp"
        _log_delivery_failed(to=to, purpose=purpose, reason="not_configured", detail=detail)
        return EmailSendResult(ok=False, failure_reason="not_configured", failure_detail=detail)

    from_addr = settings.smtp_from_address.strip() or settings.smtp_user
    from_header = f"{settings.email_from_name} <{from_addr}>"

    try:
        await asyncio.to_thread(
            _smtp_send_sync,
            host=settings.smtp_host,
            port=settings.smtp_port,
            user=settings.smtp_user,
            password=settings.smtp_password,
            from_header=from_header,
            to=to,
            subject=subject,
            html_body=html_body,
        )
        logger.info("email.sent", extra={"to": to, "provider": "smtp", "from": from_addr})
        return EmailSendResult(ok=True)
    except Exception as exc:
        detail = str(exc)
        _log_delivery_failed(to=to, purpose=purpose, reason="provider_rejected", detail=detail)
        return EmailSendResult(ok=False, failure_reason="provider_rejected", failure_detail=detail)


async def _send_via_apps_script(
    *, to: str, subject: str, html_body: str, purpose: str
) -> EmailSendResult:
    settings = get_settings()
    url = settings.apps_script_email_url.strip()
    secret = settings.apps_script_email_secret.strip()
    if not url or not secret:
        detail = "APPS_SCRIPT_EMAIL_URL and APPS_SCRIPT_EMAIL_SECRET must be set"
        _log_delivery_failed(to=to, purpose=purpose, reason="not_configured", detail=detail)
        return EmailSendResult(ok=False, failure_reason="not_configured", failure_detail=detail)

    payload = {
        "secret": secret,
        "to": to,
        "subject": subject,
        "htmlBody": html_body,
        "fromName": settings.email_from_name,
    }

    try:
        timeout = httpx.Timeout(settings.http_timeout_seconds)
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = cast(dict[str, Any], response.json())

        if not data.get("ok"):
            detail = str(data.get("error") or "Apps Script returned ok=false")
            _log_delivery_failed(to=to, purpose=purpose, reason="provider_rejected", detail=detail)
            return EmailSendResult(ok=False, failure_reason="provider_rejected", failure_detail=detail)

        logger.info("email.sent", extra={"to": to, "provider": "apps_script"})
        return EmailSendResult(ok=True)
    except Exception as exc:
        detail = str(exc)
        _log_delivery_failed(to=to, purpose=purpose, reason="provider_rejected", detail=detail)
        return EmailSendResult(ok=False, failure_reason="provider_rejected", failure_detail=detail)


async def send_otp_email(*, to: str, code: str, purpose: str) -> EmailSendResult:
    """Send a 6-digit OTP. purpose: signup | recover."""
    settings = get_settings()
    subject = _subject_for_purpose(purpose)
    html_body = _html_body_for_otp(purpose=purpose, code=code)

    if settings.email_provider == "smtp":
        return await _send_via_smtp(to=to, subject=subject, html_body=html_body, purpose=purpose)
    if settings.email_provider == "apps_script":
        return await _send_via_apps_script(
            to=to, subject=subject, html_body=html_body, purpose=purpose
        )
    return await _send_via_resend(to=to, subject=subject, html_body=html_body, purpose=purpose)
