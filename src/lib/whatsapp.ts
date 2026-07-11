/**
 * WhatsApp Cloud API helper.
 * Sends free-form text messages (works within 24 h of customer contact,
 * or use approved templates for business-initiated messages).
 *
 * Required env vars:
 *   WHATSAPP_PHONE_NUMBER_ID   — from Meta Business Suite
 *   WHATSAPP_ACCESS_TOKEN      — permanent system user token
 *   ADMIN_WHATSAPP_NUMBER      — admin's number with country code (no +)
 */

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

function getApiUrl() {
  return `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;
}

/** Returns false (and logs) instead of throwing when WhatsApp is not configured. */
async function sendMessage(to: string, body: string): Promise<boolean> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.warn("[WhatsApp] Credentials not configured — skipping message");
    return false;
  }

  // Normalise: strip spaces + leading +
  const number = to.replace(/\s+/g, "").replace(/^\+/, "");

  const res = await fetch(getApiUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: number,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    console.error("[WhatsApp] Send failed:", await res.text());
    return false;
  }
  return true;
}

// ─── Shared types ────────────────────────────────────────────────────────────

export interface BookingNotificationData {
  reference: string;
  customerName: string;
  whatsapp: string;
  bookingDate: string;  // human-readable, e.g. "Tuesday, 15 July 2025"
  timeSlot: string;     // human-readable, e.g. "2:00 PM - 4:00 PM"
  deliveryType: string; // "PICKUP" | "CARDIFF" | "POSTAGE"
  address?: string | null;
  items: { mealName: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  promoCode?: string | null;
}

function formatItems(items: BookingNotificationData["items"]): string {
  return items
    .map((i) => `  - ${i.mealName} x${i.quantity} -- GBP ${(i.unitPrice * i.quantity).toFixed(2)}`)
    .join("\n");
}

function deliveryLabel(data: BookingNotificationData): string {
  if (data.deliveryType === "PICKUP") return "Pickup";
  const loc = data.address ? ` -> ${data.address}` : "";
  return data.deliveryType === "CARDIFF"
    ? `Cardiff Delivery${loc}`
    : `UK Postage${loc}`;
}

// ─── Customer confirmation ────────────────────────────────────────────────────

export async function sendCustomerConfirmation(
  data: BookingNotificationData
): Promise<boolean> {
  const discountLine =
    data.discount > 0 ? `\nDiscount: -GBP ${data.discount.toFixed(2)}` : "";

  const deliveryLine =
    data.deliveryFee > 0 ? `\nDelivery: GBP ${data.deliveryFee.toFixed(2)}` : "";

  const message = [
    `*Malam Special Suya -- Booking Confirmed!*`,
    ``,
    `Hi ${data.customerName}! Your order is confirmed.`,
    ``,
    `*Ref:* ${data.reference}`,
    `*Date:* ${data.bookingDate}`,
    `*Time:* ${data.timeSlot}`,
    `*Delivery:* ${deliveryLabel(data)}`,
    ``,
    `*Your Order:*`,
    formatItems(data.items),
    ``,
    `Subtotal: GBP ${data.subtotal.toFixed(2)}${deliveryLine}${discountLine}`,
    `*Total: GBP ${data.total.toFixed(2)}*`,
    ``,
    `Questions? Just reply to this message.`,
    `Thank you for choosing Malam Special Suya!`,
  ].join("\n");

  return sendMessage(data.whatsapp, message);
}

// ─── Admin alert ─────────────────────────────────────────────────────────────

export async function sendAdminAlert(
  data: BookingNotificationData
): Promise<boolean> {
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
  if (!adminNumber) {
    console.warn("[WhatsApp] ADMIN_WHATSAPP_NUMBER not set — skipping alert");
    return false;
  }

  const message = [
    `*New Booking -- ${data.reference}*`,
    ``,
    `Customer: ${data.customerName} (${data.whatsapp})`,
    `Date: ${data.bookingDate} / ${data.timeSlot}`,
    `Delivery: ${deliveryLabel(data)}`,
    ``,
    `*Order:*`,
    formatItems(data.items),
    ``,
    `Total: GBP ${data.total.toFixed(2)}`,
  ].join("\n");

  return sendMessage(adminNumber, message);
}

