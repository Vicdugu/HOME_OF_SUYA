import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mergePromoCodeVisibility } from "@/lib/promo-code-visibility";

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

  const [promoWithVisibility] = promo ? await mergePromoCodeVisibility([promo]) : [null];

  if (!promoWithVisibility || promoWithVisibility.isHidden) {
    return NextResponse.json({ valid: false, message: "Invalid promo code" });
  }

  const now = new Date();
  if (promoWithVisibility.expiresAt && promoWithVisibility.expiresAt < now) {
    return NextResponse.json({
      valid: false,
      message: "This promo code has expired",
    });
  }

  if (promoWithVisibility.maxUses !== null && promoWithVisibility.usedCount >= promoWithVisibility.maxUses) {
    return NextResponse.json({
      valid: false,
      message: "This promo code has reached its usage limit",
    });
  }

  if (subtotal < promoWithVisibility.minOrder) {
    return NextResponse.json({
      valid: false,
      message: `Minimum order of £${promoWithVisibility.minOrder.toFixed(2)} required`,
    });
  }

  const discount =
    promoWithVisibility.discountType === "PERCENT"
      ? Math.round(subtotal * (promoWithVisibility.discountValue / 100) * 100) / 100
      : promoWithVisibility.discountValue;

  return NextResponse.json({
    valid: true,
    code,
    discountType: promoWithVisibility.discountType,
    discountValue: promoWithVisibility.discountValue,
    discount,
    message:
      promoWithVisibility.discountType === "PERCENT"
        ? `${promoWithVisibility.discountValue}% discount applied`
        : `£${promoWithVisibility.discountValue.toFixed(2)} discount applied`,
  });
}
