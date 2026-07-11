import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(codes);
}

export async function POST(req: NextRequest) {
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
  return NextResponse.json(code, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, isActive } = await req.json();
  const code = await prisma.promoCode.update({ where: { id }, data: { isActive } });
  return NextResponse.json(code);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.promoCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
