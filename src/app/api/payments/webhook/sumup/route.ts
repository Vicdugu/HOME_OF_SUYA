import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSumUpCheckout } from "@/lib/sumup";
import {
  sendCustomerConfirmation,
  sendAdminAlert,
} from "@/lib/whatsapp";
import {
  sendCustomerConfirmationEmail,
  sendAdminBookingAlert,
} from "@/lib/email";
import { formatBookingDate, formatTimeSlot } from "@/lib/availability";

/**
 * Verify SumUp webhook signature using HMAC-SHA256
 * SumUp sends signature in X-Signature header
 */
function verifySumUpSignature(body: string, signature: string | null): boolean {
  if (!signature) {
    console.error("[SumUp webhook] Missing X-Signature header");
    return false;
  }

  const webhookSecret = process.env.SUMUP_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[SumUp webhook] SUMUP_WEBHOOK_SECRET not configured");
    return false;
  }

  // SumUp sends HMAC-SHA256 signature
  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  // Use constant-time comparison to prevent timing attacks
  return signature === expectedSignature;
}

/**
 * SumUp webhook — fires when a checkout is completed.
 * Signature must be verified before processing payment.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature");
  const body = await req.text();

  // Verify webhook signature
  if (!verifySumUpSignature(body, signature)) {
    console.error("[SumUp webhook] Signature verification failed");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let webhookData;
  try {
    webhookData = JSON.parse(body);
  } catch {
    console.error("[SumUp webhook] Invalid JSON body");
    return NextResponse.json({ received: true });
  }

  const checkoutId = typeof webhookData.id === "string" ? webhookData.id : null;

  if (!checkoutId) {
    return NextResponse.json({ received: true });
  }

  let checkout;
  try {
    checkout = await getSumUpCheckout(checkoutId);
  } catch (err) {
    console.error("[SumUp webhook] Checkout verification failed");
    return NextResponse.json({ received: true });
  }

  const isPaid =
    checkout.status === "PAID" ||
    checkout.status === "SUCCESSFUL";

  if (!isPaid) {
    return NextResponse.json({ received: true });
  }

  const booking = await prisma.booking.findFirst({
    where: {
      paymentRef: checkout.id,
      reference: checkout.checkout_reference,
      paymentStatus: "UNPAID",
      paymentProvider: "sumup",
    },
    include: { items: true },
  });

  if (booking && Math.abs(booking.total - checkout.amount) < 0.01) {
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED", paymentStatus: "PAID" },
      include: { items: true },
    });

    // Fire WhatsApp and email notifications — failures are logged, never throw
    try {
      const notifData = {
        reference: updatedBooking.reference,
        customerName: updatedBooking.customerName,
        whatsapp: updatedBooking.whatsapp,
        email: updatedBooking.email,
        bookingDate: formatBookingDate(
          updatedBooking.bookingDate.toISOString().slice(0, 10)
        ),
        timeSlot: formatTimeSlot(updatedBooking.timeSlot),
        deliveryType: updatedBooking.deliveryType,
        address: updatedBooking.address,
        items: updatedBooking.items.map((i) => ({
          mealName: i.mealName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        subtotal: updatedBooking.subtotal,
        deliveryFee: updatedBooking.deliveryFee,
        discount: updatedBooking.discount,
        total: updatedBooking.total,
        promoCode: null,
      };
      await Promise.allSettled([
        // WhatsApp notifications
        sendCustomerConfirmation(notifData),
        sendAdminAlert(notifData),
        // Email notifications
        sendCustomerConfirmationEmail(notifData),
        sendAdminBookingAlert(notifData),
      ]);
    } catch (err) {
      console.error("[SumUp webhook] Notification error:", err);
    }
  }

  return NextResponse.json({ received: true });
}
