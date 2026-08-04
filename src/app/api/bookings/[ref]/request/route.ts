import { NextResponse } from "next/server";
import { logBookingEvent } from "@/lib/booking-analytics";
import { prisma } from "@/lib/prisma";
import { normalizeCustomerRequestType, updateBookingOps } from "@/lib/booking-ops";
import { getRequestFingerprint, isRateLimited } from "@/lib/request-guard";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  const rateLimitKey = getRequestFingerprint(req, "bookings:request");
  if (isRateLimited(rateLimitKey, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many change requests submitted. Please wait a moment and try again." }, { status: 429 });
  }

  const { ref } = await params;
  const payload = await req.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const requestType = normalizeCustomerRequestType(body.requestType);
  const message = String(body.message ?? "").trim();

  if (!requestType) {
    return NextResponse.json({ error: "Request type is invalid" }, { status: 400 });
  }

  if (message.length < 10) {
    return NextResponse.json({ error: "Please provide more detail" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { reference: ref } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  await updateBookingOps(booking.id, {
    customerRequestType: requestType,
    customerRequestMessage: message,
    customerRequestStatus: "OPEN",
    customerRequestCreatedAt: new Date(),
  });

  await logBookingEvent({
    eventName: "booking_change_requested",
    page: "track",
    reference: booking.reference,
    metadata: { requestType },
  });

  return NextResponse.json({ ok: true, message: "Your request has been sent to the team." });
}