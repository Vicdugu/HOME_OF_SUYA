import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { select: { mealName: true, quantity: true } } },
    take: 200,
  });
  return NextResponse.json(bookings);
}

export async function PUT(req: NextRequest) {
  const { id, status } = await req.json();
  const booking = await prisma.booking.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(booking);
}
