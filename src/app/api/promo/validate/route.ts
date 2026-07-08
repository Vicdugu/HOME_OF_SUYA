import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const code = String(body.code ?? "").trim().toUpperCase();
  const subtotal = Number(body.subtotal ?? 0);

  if (!code) {
    return NextResponse.json({ valid: false, message: "Enter a promo code" });
  }

  const promo = await prisma.promoCode.findFirst({
    where: { code, isActive: true },
  });

  if (!promo) {
    return NextResponse.json({ valid: false, message: "Invalid promo code" });
  }

  const now = new Date();
  if (promo.expiresAt && promo.expiresAt < now) {
    return NextResponse.json({
      valid: false,
      message: "This promo code has expired",
    });
  }

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({
      valid: false,
      message: "This promo code has reached its usage limit",
    });
  }

  if (subtotal < promo.minOrder) {
    return NextResponse.json({
      valid: false,
      message: `Minimum order of £${promo.minOrder.toFixed(2)} required`,
    });
  }

  const discount =
    promo.discountType === "PERCENT"
      ? Math.round(subtotal * (promo.discountValue / 100) * 100) / 100
      : promo.discountValue;

  return NextResponse.json({
    valid: true,
    code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discount,
    message:
      promo.discountType === "PERCENT"
        ? `${promo.discountValue}% discount applied`
        : `£${promo.discountValue.toFixed(2)} discount applied`,
  });
}
