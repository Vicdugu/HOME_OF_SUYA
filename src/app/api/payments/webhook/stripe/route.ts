import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendCustomerConfirmation,
  sendAdminAlert,
} from "@/lib/whatsapp";
import { formatBookingDate, formatTimeSlot } from "@/lib/availability";

/**
 * Stripe webhook — verifies signature and marks booking as PAID.
 * Register this URL in Stripe Dashboard → Webhooks.
 * Events to listen for: checkout.session.completed
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Dynamically import stripe to avoid build errors when key is not set
  let stripe: import("stripe").default | null = null;
  try {
    const Stripe = (await import("stripe")).default;
    if (process.env.STRIPE_SECRET_KEY) {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2026-06-24.dahlia",
      });
    }
  } catch {
    // Stripe not installed — skip
  }

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 400 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data
      .object as import("stripe").Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED", paymentStatus: "PAID" },
        include: { items: true },
      });

      // Fire WhatsApp notifications — failures are logged, never throw
      try {
        const notifData = {
          reference: booking.reference,
          customerName: booking.customerName,
          whatsapp: booking.whatsapp,
          bookingDate: formatBookingDate(
            booking.bookingDate.toISOString().slice(0, 10)
          ),
          timeSlot: formatTimeSlot(booking.timeSlot),
          deliveryType: booking.deliveryType,
          address: booking.address,
          items: booking.items.map((i) => ({
            mealName: i.mealName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          subtotal: booking.subtotal,
          deliveryFee: booking.deliveryFee,
          discount: booking.discount,
          total: booking.total,
          promoCode: null,
        };
        await Promise.allSettled([
          sendCustomerConfirmation(notifData),
          sendAdminAlert(notifData),
        ]);
      } catch (err) {
        console.error("[Stripe webhook] Notification error:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
