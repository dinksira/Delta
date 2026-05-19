/**
 * DeltaLabs temporary OTP email relay (Google Apps Script).
 *
 * Setup:
 * 1. Open https://script.google.com/home → New project → paste this file.
 * 2. Project Settings → Script properties → add EMAIL_SECRET (long random string).
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web app URL (ends with /exec) into Render as APPS_SCRIPT_EMAIL_URL.
 * 5. Set APPS_SCRIPT_EMAIL_SECRET to the same value as EMAIL_SECRET.
 *
 * Remove this after you verify a domain on Resend and switch EMAIL_PROVIDER=resend.
 */

function doPost(e) {
  return handleRequest_(e);
}

function doGet(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    var expectedSecret = PropertiesService.getScriptProperties().getProperty("EMAIL_SECRET");
    if (!expectedSecret) {
      return jsonResponse_({ ok: false, error: "EMAIL_SECRET script property is not set" });
    }

    var body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      body = e.parameter;
    }

    if (String(body.secret || "") !== String(expectedSecret)) {
      return jsonResponse_({ ok: false, error: "Unauthorized" });
    }

    var to = String(body.to || "").trim();
    var subject = String(body.subject || "").trim();
    var htmlBody = String(body.htmlBody || "");
    var fromName = String(body.fromName || "DeltaLabs");

    if (!to || !subject || !htmlBody) {
      return jsonResponse_({ ok: false, error: "Missing to, subject, or htmlBody" });
    }

    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: htmlBody,
      name: fromName,
    });

    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

