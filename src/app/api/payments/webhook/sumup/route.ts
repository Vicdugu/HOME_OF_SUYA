import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendCustomerConfirmation,
  sendAdminAlert,
} from "@/lib/whatsapp";
import { formatBookingDate, formatTimeSlot } from "@/lib/availability";

/**
 * SumUp webhook — fires when a checkout is completed.
 * SumUp sends: { id, checkout_reference, status, event_type }
 * Verify by matching checkout_reference to our booking reference.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  const checkoutRef = body.checkout_reference ?? body.id ?? null;
  const isPaid =
    body.status === "PAID" ||
    body.event_type === "CHECKOUT_COMPLETED" ||
    body.status === "SUCCESSFUL";

  if (!checkoutRef || !isPaid) {
    return NextResponse.json({ received: true });
  }

  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ paymentRef: checkoutRef }, { reference: checkoutRef }],
      paymentStatus: "UNPAID",
    },
    include: { items: true },
  });

  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED", paymentStatus: "PAID" },
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
      console.error("[SumUp webhook] Notification error:", err);
    }
  }

  return NextResponse.json({ received: true });
}
