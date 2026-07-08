/**
 * Admin email notifications via Resend.
 * Customer email notifications are disabled by default.
 * Set CUSTOMER_EMAIL_ENABLED=true in .env to activate.
 */

import { Resend } from "resend";
import type { BookingNotificationData } from "./whatsapp";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL ?? "noreply@malamspecialsuya.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/**
 * Sends a new-booking alert email to the admin.
 */
export async function sendAdminBookingAlert(
  data: BookingNotificationData
): Promise<boolean> {
  if (!ADMIN_EMAIL || !process.env.RESEND_API_KEY) return false;

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
