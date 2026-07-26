import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createStripeSession } from "@/lib/stripe-lib";

export async function POST(req: NextRequest) {
  const { bookingId, reference } = await req.json();

  if (!bookingId || !reference) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { items: true },
    });

    if (!booking || booking.reference !== reference) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.paymentStatus !== "UNPAID") {
      return NextResponse.json({ error: "Booking payment already processed" }, { status: 409 });
    }

    if (booking.items.length === 0) {
      return NextResponse.json({ error: "Booking has no items" }, { status: 400 });
    }

    const { sessionId, checkoutUrl } = await createStripeSession({
      bookingId: booking.id,
      reference: booking.reference,
      items: booking.items.map((item) => ({
        name: item.mealName,
        unitAmount: item.unitPrice,
        quantity: item.quantity,
      })),
      deliveryFee: booking.deliveryFee,
      appUrl,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentProvider: "stripe", paymentRef: sessionId },
    });

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
