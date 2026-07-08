/**
 * Sends a WhatsApp message via Meta WhatsApp Cloud API.
 * Uses free-form text template for customer confirmations
 * and simple text for admin alerts.
 */

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const API_URL = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

async function sendMessage(to: string, body: string): Promise<boolean> {
  // Normalise number — strip spaces, ensure it starts with country code
  const number = to.replace(/\s+/g, "").replace(/^\+/, "");

  const payload = {
    messaging_product: "whatsapp",
    to: number,
    type: "text",
    text: { body },
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[WhatsApp] Failed to send:", err);
    return false;
  }

  return true;
}

export interface BookingNotificationData {
  reference: string;
  customerName: string;
  whatsapp: string;
  bookingDate: string;
  timeSlot: string;
  deliveryType: string;
  address?: string | null;
  items: { mealName: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  promoCode?: string | null;
}

function formatItems(
  items: BookingNotificationData["items"]
): string {
  return items
    .map(
      (i) =>
        `  • ${i.mealName} x${i.quantity} — £${(i.unitPrice * i.quantity).toFixed(2)}`
    )
    .join("\n");
}

/**
 * Sends a booking confirmation WhatsApp message to the customer.
 */
export async function sendCustomerConfirmation(
  data: BookingNotificationData
): Promise<boolean> {
  const delivery =
    data.deliveryType === "PICKUP"
      ? "Pickup"
      : data.deliveryType === "CARDIFF"
        ? `Cardiff Delivery${data.address ? ` — ${data.address}` : ""}`
        : `Postage${data.address ? ` — ${data.address}` : ""}`;

  const discountLine =
    data.discount > 0 ? `\n🏷️ Discount: -£${data.discount.toFixed(2)}` : "";

  const message = `🔥 *Malam Special Suya — Booking Confirmed!*

Hi ${data.customerName}! Your order is confirmed ✅

📋 *Reference:* ${data.reference}
📅 *Date:* ${data.bookingDate}
⏰ *Time Slot:* ${data.timeSlot}
🚚 *Delivery:* ${delivery}

*Your Order:*
${formatItems(data.items)}

💷 Subtotal: £${data.subtotal.toFixed(2)}
${data.deliveryFee > 0 ? `🚚 Delivery: £${data.deliveryFee.toFixed(2)}` : ""}${discountLine}
*Total: £${data.total.toFixed(2)}*

If you have any questions, please reply to this message.

Thank you for choosing Malam Special Suya! 🍖`;

  return sendMessage(data.whatsapp, message);
}

/**
 * Sends an alert to the admin WhatsApp when a new booking is confirmed.
 */
export async function sendAdminAlert(
  data: BookingNotificationData
): Promise<boolean> {
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
  if (!adminNumber) return false;

  const message = `🆕 *New Booking — ${data.reference}*

👤 ${data.customerName} (${data.whatsapp})
📅 ${data.bookingDate} — ${data.timeSlot}
🚚 ${data.deliveryType}${data.address ? ` → ${data.address}` : ""}

*Order:*
${formatItems(data.items)}

💷 Total: £${data.total.toFixed(2)}`;

  return sendMessage(adminNumber, message);
}
