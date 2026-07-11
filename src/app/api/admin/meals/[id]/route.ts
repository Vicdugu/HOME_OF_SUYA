import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();
  const meal = await prisma.meal.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      price: Number(data.price),
      imageUrl: data.imageUrl,
      isAvailable: data.isAvailable,
      sortOrder: data.sortOrder,
    },
  });
  return NextResponse.json(meal);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.meal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
