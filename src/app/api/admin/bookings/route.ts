import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRequest } from "@/lib/admin-api-auth";

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { select: { mealName: true, quantity: true } } },
    take: 200,
  });
  return NextResponse.json(bookings);
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id, status } = await req.json();
  const booking = await prisma.booking.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(booking);
}
