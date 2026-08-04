import { NextResponse } from "next/server";
import { createCateringEnquiry, normalizeServiceStyle } from "@/lib/catering-enquiries";
import { sendCateringEnquiryEmail } from "@/lib/email";
import { logBookingEvent } from "@/lib/booking-analytics";
import { getRequestFingerprint, isRateLimited } from "@/lib/request-guard";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  const rateLimitKey = getRequestFingerprint(req, "contact");
  if (isRateLimited(rateLimitKey, 6, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many enquiries submitted. Please wait a moment and try again." }, { status: 429 });
  }

  const payload = await req.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const data = payload as Record<string, unknown>;
  const fullName = String(data.fullName ?? data.name ?? "").trim();
  const email = String(data.email ?? "").trim();
  const phone = String(data.phone ?? "").trim();
  const eventDateRaw = String(data.eventDate ?? "").trim();
  const guestCountRaw = String(data.guestCount ?? "").trim();
  const venue = String(data.venue ?? "").trim();
  const budget = String(data.budget ?? "").trim();
  const serviceStyle = normalizeServiceStyle(data.serviceStyle);
  const deliveryArea = String(data.deliveryArea ?? "").trim();
  const message = String(data.message ?? "").trim();
  const guestCount = guestCountRaw ? Number(guestCountRaw) : null;
  const eventDate = eventDateRaw ? new Date(`${eventDateRaw}T00:00:00`) : null;

  if (!fullName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }

  if (!message || message.length < 10) {
    return NextResponse.json(
      { error: "Please provide a few more details about your enquiry" },
      { status: 400 }
    );
  }

  if (guestCount !== null && (!Number.isFinite(guestCount) || guestCount <= 0)) {
    return NextResponse.json({ error: "Guest count must be a positive number" }, { status: 400 });
  }

  if (eventDate && Number.isNaN(eventDate.getTime())) {
    return NextResponse.json({ error: "Event date is invalid" }, { status: 400 });
  }

  const enquiry = await createCateringEnquiry({
    fullName,
    email,
    phone: phone || null,
    eventDate,
    guestCount,
    venue: venue || null,
    budget: budget || null,
    serviceStyle,
    deliveryArea: deliveryArea || null,
    message,
  });

  const delivered = await sendCateringEnquiryEmail({
    fullName,
    email,
    phone: phone || null,
    eventDate: enquiry.eventDate,
    guestCount,
    venue: venue || null,
    budget: budget || null,
    serviceStyle,
    deliveryArea: deliveryArea || null,
    message,
  });

  if (!delivered) {
    console.warn("[Contact] Catering enquiry stored but admin delivery is not configured", { id: enquiry.id });
  }

  await logBookingEvent({
    eventName: "catering_enquiry_submitted",
    page: "contact",
    metadata: {
      enquiryId: enquiry.id,
      delivered,
      hasPhone: Boolean(phone),
      hasEventDate: Boolean(eventDate),
      guestCount,
    },
  });

  return NextResponse.json({
    ok: true,
    delivered,
    enquiryId: enquiry.id,
    message: delivered
      ? "Thanks. Your catering enquiry has been sent to the team."
      : "Thanks. Your catering enquiry has been received and saved for admin follow-up.",
  });
}