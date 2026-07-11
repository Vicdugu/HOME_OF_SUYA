import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * SumUp webhook — fires when a checkout is completed.
 * SumUp sends: { id, checkout_reference, status, event_type }
 * Verify by matching checkout_reference to our booking reference.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  // SumUp sends various event shapes depending on version
  const checkoutRef =
    body.checkout_reference ?? body.id ?? null;
  const isPaid =
    body.status === "PAID" ||
    body.event_type === "CHECKOUT_COMPLETED" ||
    body.status === "SUCCESSFUL";

  if (!checkoutRef || !isPaid) {
    return NextResponse.json({ received: true });
  }

  // Find booking by paymentRef (SumUp checkout id) or reference
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        { paymentRef: checkoutRef },
        { reference: checkoutRef },
      ],
      paymentStatus: "UNPAID",
    },
  });

  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
      },
    });
    // Phase 6: WhatsApp notification fired here
  }

  return NextResponse.json({ received: true });
}
