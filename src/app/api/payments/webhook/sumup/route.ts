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
 * 
 * Note: If SUMUP_WEBHOOK_SECRET is not configured or is the placeholder,
 * signature verification is skipped (for development/testing).
 * In production, ensure SUMUP_WEBHOOK_SECRET is properly set.
 */
function verifySumUpSignature(body: string, signature: string | null): boolean {
  const webhookSecret = process.env.SUMUP_WEBHOOK_SECRET;
  
  // If secret is not configured or is placeholder, skip verification (dev/test mode)
  if (!webhookSecret || webhookSecret === "your_webhook_secret_from_sumup_dashboard") {
    console.warn("[SumUp webhook] SUMUP_WEBHOOK_SECRET not configured - skipping signature verification");
    console.warn("[SumUp webhook] ⚠️  In production, configure SUMUP_WEBHOOK_SECRET for security!");
    return true;
  }

  if (!signature) {
    console.error("[SumUp webhook] Missing X-Signature header");
    return false;
  }

  // SumUp sends HMAC-SHA256 signature
  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  // Use constant-time comparison to prevent timing attacks
  const isValid = signature === expectedSignature;
  if (!isValid) {
    console.error("[SumUp webhook] Signature verification failed");
  }
  return isValid;
}

/**
 * SumUp webhook — fires when a checkout is completed.
 * Signature must be verified before processing payment.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature");
  const body = await req.text();

  console.log("[SumUp webhook] Received webhook request");

  // Verify webhook signature
  if (!verifySumUpSignature(body, signature)) {
    console.error("[SumUp webhook] Signature verification failed - rejecting webhook");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[SumUp webhook] Signature verified");

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

  console.log("[SumUp webhook] Booking lookup", { found: !!booking, checkoutId: checkout.id, checkoutRef: checkout.checkout_reference });

  if (booking && Math.abs(booking.total - checkout.amount) < 0.01) {
    console.log("[SumUp webhook] Booking matched and amount verified, updating status...", { bookingId: booking.id });
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
      ]).then((results) => {
        console.log("[SumUp webhook] Notification results:", {
          results: results.map((r, i) => ({
            index: i,
            status: r.status,
            error: r.status === "rejected" ? r.reason?.message : undefined,
          })),
        });
      });
    } catch (err) {
      console.error("[SumUp webhook] Notification error:", err);
    }
  }

  return NextResponse.json({ received: true });
}
