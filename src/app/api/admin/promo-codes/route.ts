import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRequest } from "@/lib/admin-api-auth";
import { mergePromoCodeVisibility, setPromoCodeHidden } from "@/lib/promo-code-visibility";

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "50")));
  const skip = (page - 1) * limit;

  const [codes, total] = await Promise.all([
    prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.promoCode.count(),
  ]);
  
  const codesWithVisibility = await mergePromoCodeVisibility(codes);
  return NextResponse.json({
    data: codesWithVisibility,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const data = await req.json();
  const code = await prisma.promoCode.create({
    data: {
      code: String(data.code).toUpperCase().trim(),
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      minOrder: Number(data.minOrder ?? 0),
      maxUses: data.maxUses ? Number(data.maxUses) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive ?? true,
    },
  });
  const [codeWithVisibility] = await mergePromoCodeVisibility([code]);
  return NextResponse.json(codeWithVisibility, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id, isActive, isHidden } = await req.json();
  const code = await prisma.promoCode.update({
    where: { id },
    data: isActive === undefined ? {} : { isActive },
  });
  if (typeof isHidden === "boolean") {
    await setPromoCodeHidden(id, isHidden);
  }
  const [codeWithVisibility] = await mergePromoCodeVisibility([code]);
  return NextResponse.json(codeWithVisibility);
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id } = await req.json();
  await prisma.promoCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
