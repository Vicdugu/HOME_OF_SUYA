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
    const expectedReference = session.metadata?.reference;
    const amountTotal = session.amount_total;
    const sessionPaid = session.payment_status === "paid";

    if (bookingId && sessionPaid && amountTotal !== null) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { items: true },
      });

      const expectedAmount = booking ? Math.round(booking.total * 100) : null;

      if (
        booking &&
        booking.paymentStatus === "UNPAID" &&
        booking.paymentProvider === "stripe" &&
        booking.paymentRef === session.id &&
        booking.reference === expectedReference &&
        expectedAmount === amountTotal
      ) {
        const updatedBooking = await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "CONFIRMED", paymentStatus: "PAID" },
          include: { items: true },
        });

        // Fire WhatsApp notifications — failures are logged, never throw
        try {
          const notifData = {
            reference: updatedBooking.reference,
            customerName: updatedBooking.customerName,
            whatsapp: updatedBooking.whatsapp,
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
            sendCustomerConfirmation(notifData),
            sendAdminAlert(notifData),
          ]);
        } catch (err) {
          console.error("[Stripe webhook] Notification error:", err);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
