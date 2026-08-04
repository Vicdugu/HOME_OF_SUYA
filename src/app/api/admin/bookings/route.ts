import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRequest } from "@/lib/admin-api-auth";
import {
  mergeBookingOps,
  normalizeCustomerRequestStatus,
  normalizeFulfilmentStage,
  updateBookingOps,
} from "@/lib/booking-ops";

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { select: { mealName: true, quantity: true } } },
    take: 200,
  });
  return NextResponse.json(await mergeBookingOps(bookings));
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id, status, fulfilmentStage, customerRequestStatus } = await req.json();
  const booking = await prisma.booking.update({
    where: { id },
    data: { status },
  });
  await updateBookingOps(booking.id, {
    fulfilmentStage: normalizeFulfilmentStage(fulfilmentStage),
    customerRequestStatus: normalizeCustomerRequestStatus(customerRequestStatus),
  });
  const [bookingWithOps] = await mergeBookingOps([booking]);
  return NextResponse.json(bookingWithOps);
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id } = await req.json();

  if (typeof id !== "string" || id.trim().length === 0) {
    return NextResponse.json({ error: "Booking id is required" }, { status: 400 });
  }

  await prisma.booking.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
