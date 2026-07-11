import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSumUpCheckout } from "@/lib/sumup";

export async function POST(req: NextRequest) {
  const { bookingId, reference, total } = await req.json();

  if (!bookingId || !reference || !total) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  try {
    const { checkoutId, checkoutUrl } = await createSumUpCheckout({
      reference,
      amount: total,
      description: `Malam Special Suya — ${reference}`,
      redirectUrl: `${appUrl}/confirmation/${reference}`,
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentProvider: "sumup", paymentRef: checkoutId },
    });

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "SumUp error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
