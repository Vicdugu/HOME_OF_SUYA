import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Mock promo codes — replaced with DB query once Neon is connected.
 *
 * Real implementation:
 *   const code = await prisma.promoCode.findFirst({
 *     where: { code: body.code.toUpperCase(), isActive: true }
 *   });
 */
const MOCK_CODES: Record<
  string,
  { type: "PERCENT" | "FIXED"; value: number; minOrder: number }
> = {
  SUYA10: { type: "PERCENT", value: 10, minOrder: 0 },
  WELCOME5: { type: "FIXED", value: 5, minOrder: 15 },
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const code = String(body.code ?? "").trim().toUpperCase();
  const subtotal = Number(body.subtotal ?? 0);

  if (!code) {
    return NextResponse.json({ valid: false, message: "Enter a promo code" });
  }

  const promo = MOCK_CODES[code];

  if (!promo) {
    return NextResponse.json({ valid: false, message: "Invalid promo code" });
  }

  if (subtotal < promo.minOrder) {
    return NextResponse.json({
      valid: false,
      message: `Minimum order of £${promo.minOrder.toFixed(2)} required for this code`,
    });
  }

  const discount =
    promo.type === "PERCENT"
      ? Math.round(subtotal * (promo.value / 100) * 100) / 100
      : promo.value;

  return NextResponse.json({
    valid: true,
    code,
    discountType: promo.type,
    discountValue: promo.value,
    discount,
    message:
      promo.type === "PERCENT"
        ? `${promo.value}% discount applied`
        : `£${promo.value.toFixed(2)} discount applied`,
  });
}
