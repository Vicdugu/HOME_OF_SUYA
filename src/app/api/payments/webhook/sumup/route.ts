import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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
 * SumUp webhook — fires when a checkout is completed.
 * SumUp sends: { id, checkout_reference, status, event_type }
 * Verify by matching checkout_reference to our booking reference.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  const checkoutId = typeof body.id === "string" ? body.id : null;

  if (!checkoutId) {
    return NextResponse.json({ received: true });
  }

  let checkout;
  try {
    checkout = await getSumUpCheckout(checkoutId);
  } catch (err) {
    console.error("[SumUp webhook] Checkout verification error:", err);
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
