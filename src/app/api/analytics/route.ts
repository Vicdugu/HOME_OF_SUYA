import { NextResponse } from "next/server";
import { logBookingEvent } from "@/lib/booking-analytics";
import { getRequestFingerprint, isRateLimited } from "@/lib/request-guard";

export async function POST(req: Request) {
  const key = getRequestFingerprint(req, "analytics");
  if (isRateLimited(key, 40, 60_000)) {
    return NextResponse.json({ ok: true, rateLimited: true });
  }

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const eventName = String(body.eventName ?? "").trim();
  const page = String(body.page ?? "").trim() || null;
  const reference = String(body.reference ?? "").trim() || null;
  const metadata = body.metadata && typeof body.metadata === "object"
    ? body.metadata as Record<string, unknown>
    : null;

  if (!eventName) {
    return NextResponse.json({ error: "Event name is required" }, { status: 400 });
  }

  await logBookingEvent({ eventName, page, reference, metadata });
  return NextResponse.json({ ok: true });
}