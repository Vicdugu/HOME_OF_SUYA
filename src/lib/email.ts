/**
 * Admin email notifications via Resend.
 * Customer email notifications are disabled by default.
 * Set CUSTOMER_EMAIL_ENABLED=true in .env to activate.
 */

import { Resend } from "resend";
import type { BookingNotificationData } from "./whatsapp";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.FROM_EMAIL ?? "noreply@malamspecialsuya.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/**
 * Sends a new-booking alert email to the admin.
 */
export async function sendAdminBookingAlert(
  data: BookingNotificationData
): Promise<boolean> {
  const resend = getResend();
  if (!ADMIN_EMAIL || !resend) return false;

  const itemsHtml = data.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:4px 8px">${i.mealName}</td>
          <td style="padding:4px 8px;text-align:center">${i.quantity}</td>
          <td style="padding:4px 8px;text-align:right">£${(i.unitPrice * i.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const { error } = await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Booking — ${data.reference}`,
    html: `
      <h2>New Booking Received</h2>
      <p><strong>Reference:</strong> ${data.reference}</p>
      <p><strong>Customer:</strong> ${data.customerName}</p>
      <p><strong>WhatsApp:</strong> ${data.whatsapp}</p>
      <p><strong>Date:</strong> ${data.bookingDate} — ${data.timeSlot}</p>
      <p><strong>Delivery:</strong> ${data.deliveryType}${data.address ? ` → ${data.address}` : ""}</p>
      <table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">
        <thead>
          <tr style="background:#C41E3A;color:#fff">
            <th style="padding:6px 8px;text-align:left">Item</th>
            <th style="padding:6px 8px">Qty</th>
            <th style="padding:6px 8px;text-align:right">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p><strong>Total: £${data.total.toFixed(2)}</strong></p>
    `,
  });

  if (error) {
    console.error("[Email] Admin alert failed:", error);
    return false;
  }

  return true;
}

/**
 * Sends a booking confirmation email to the customer.
 * Only runs if CUSTOMER_EMAIL_ENABLED=true.
 */
export async function sendCustomerConfirmationEmail(
  data: BookingNotificationData
): Promise<boolean> {
  if (process.env.CUSTOMER_EMAIL_ENABLED !== "true") return false;
  // Will be implemented when customer emails are activated
  return false;
}

// ─── Admin Auth Emails ────────────────────────────────────────────────────────

function emailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:system-ui,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#1A1A1A;border-radius:12px;overflow:hidden;border:1px solid #2A2A2A">
    <div style="background:linear-gradient(135deg,#C41E3A,#8B0000);padding:24px;text-align:center">
      <h1 style="color:#D4AF37;margin:0;font-size:22px;font-weight:900;letter-spacing:-0.5px">Malam Special Suya</h1>
      <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">Admin Portal</p>
    </div>
    <div style="padding:32px 28px;color:#E0E0E0">${bodyHtml}</div>
    <div style="padding:16px 28px;border-top:1px solid #2A2A2A;text-align:center">
      <p style="color:#555;font-size:11px;margin:0">This email was sent by Malam Special Suya Admin System.<br>Do not share this email with anyone.</p>
    </div>
  </div>
</body>
</html>`;
}

function actionBtn(url: string, label: string): string {
  return `<div style="text-align:center;margin:28px 0">
    <a href="${url}" style="background:#C41E3A;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block">${label}</a>
  </div>
  <p style="font-size:12px;color:#555;text-align:center">Or copy this link:<br><span style="color:#D4AF37;word-break:break-all">${url}</span></p>`;
}

/**
 * Sends account verification email to a newly created admin.
 * Includes a link to set password and activate the account.
 */
export async function sendVerificationEmail(
  to: string,
  username: string,
  verifyUrl: string
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not set — skipping verification email");
    console.log("[Email] Verify URL:", verifyUrl);
    return false;
  }

  const body = `
    <h2 style="color:#fff;margin-top:0">You've been added as an admin</h2>
    <p>Hi <strong style="color:#D4AF37">${username}</strong>,</p>
    <p>An admin account has been created for you on the Malam Special Suya portal.</p>
    <p>Click the button below to set your password and activate your account. <strong>This link expires in 24 hours.</strong></p>
    ${actionBtn(verifyUrl, "Set Password & Activate Account")}
    <p style="color:#888;font-size:13px">If you did not expect this email, please ignore it.</p>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Activate your Malam Special Suya admin account",
    html: emailShell(body),
  });

  if (error) { console.error("[Email] Verification send failed:", error); return false; }
  return true;
}

/**
 * Sends password reset email to an admin.
 * Includes a time-limited link to reset their password.
 */
export async function sendPasswordResetEmail(
  to: string,
  username: string,
  resetUrl: string
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not set — skipping reset email");
    console.log("[Email] Reset URL:", resetUrl);
    return false;
  }

  const body = `
    <h2 style="color:#fff;margin-top:0">Password Reset Request</h2>
    <p>Hi <strong style="color:#D4AF37">${username}</strong>,</p>
    <p>We received a request to reset your Malam Special Suya admin password.</p>
    <p>Click the button below to set a new password. <strong>This link expires in 1 hour.</strong></p>
    ${actionBtn(resetUrl, "Reset Password")}
    <p style="color:#888;font-size:13px">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Malam Special Suya admin password",
    html: emailShell(body),
  });

  if (error) { console.error("[Email] Reset send failed:", error); return false; }
  return true;
}
