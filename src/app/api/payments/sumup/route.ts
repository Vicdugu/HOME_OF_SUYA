import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSumUpCheckout } from "@/lib/sumup";

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
      select: { id: true, reference: true, total: true, paymentStatus: true },
    });

    if (!booking || booking.reference !== reference) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.paymentStatus !== "UNPAID") {
      return NextResponse.json({ error: "Booking payment already processed" }, { status: 409 });
    }

    const { checkoutId, checkoutUrl } = await createSumUpCheckout({
      reference: booking.reference,
      amount: booking.total,
      description: `Home of Suya — ${booking.reference}`,
      redirectUrl: `${appUrl}/confirmation/${booking.reference}`,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentProvider: "sumup", paymentRef: checkoutId },
    });

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "SumUp error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
