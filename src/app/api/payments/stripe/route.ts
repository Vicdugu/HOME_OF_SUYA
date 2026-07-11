import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createStripeSession } from "@/lib/stripe-lib";

export async function POST(req: NextRequest) {
  const { bookingId, reference, items, deliveryFee } = await req.json();

  if (!bookingId || !reference || !items?.length) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  try {
    const { sessionId, checkoutUrl } = await createStripeSession({
      bookingId,
      reference,
      items: items.map(
        (i: { mealName: string; unitPrice: number; quantity: number }) => ({
          name: i.mealName,
          unitAmount: i.unitPrice,
          quantity: i.quantity,
        })
      ),
      deliveryFee: deliveryFee ?? 0,
      appUrl,
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentProvider: "stripe", paymentRef: sessionId },
    });

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
