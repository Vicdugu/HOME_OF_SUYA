import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRequest } from "@/lib/admin-api-auth";
import { mergeBookingOps } from "@/lib/booking-ops";
import { sendBookingReminderEmail } from "@/lib/email";
import { formatCurrency } from "@/lib/utils";
import type { BookingNotificationData } from "@/lib/whatsapp";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id } = await params;
  const { previewOnly } = await req.json().catch(() => ({}));

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
  }

  // Fetch the booking with items
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Only allow reminders for pending payments
  if (booking.paymentStatus === "PAID") {
    return NextResponse.json(
      { error: "This booking has already been paid" },
      { status: 400 }
    );
  }

  if (!booking.email) {
    return NextResponse.json(
      { error: "No customer email found for this booking" },
      { status: 400 }
    );
  }

  // Build the base URL from request
  const baseUrl =
    req.headers.get("x-forwarded-proto") && req.headers.get("x-forwarded-host")
      ? `${req.headers.get("x-forwarded-proto")}://${req.headers.get("x-forwarded-host")}`
      : "http://localhost:3000";

  const paymentLink = `${baseUrl}/payment?ref=${booking.reference}`;

  // Build notification data from booking
  const notificationData: BookingNotificationData & { paymentLink: string } = {
    reference: booking.reference,
    customerName: booking.customerName,
    whatsapp: booking.whatsapp,
    email: booking.email,
    bookingDate: booking.bookingDate.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    timeSlot: booking.timeSlot,
    deliveryType: booking.deliveryType,
    address: booking.address,
    subtotal: booking.subtotal,
    deliveryFee: booking.deliveryFee,
    discount: booking.discount,
    total: booking.total,
    items: booking.items.map((item) => ({
      mealName: item.mealName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    paymentLink,
  };

  // If preview only, return the email data without sending
  if (previewOnly) {
    return NextResponse.json({
      preview: true,
      emailData: notificationData,
    });
  }

  // Send the actual email
  const sent = await sendBookingReminderEmail(notificationData);

  if (!sent) {
    return NextResponse.json(
      { error: "Failed to send reminder email" },
      { status: 500 }
    );
  }

  // Update the booking with reminder sent timestamp
  const updated = await prisma.booking.update({
    where: { id },
    data: { reminderEmailSentAt: new Date() },
    include: { items: true },
  });

  const [bookingWithOps] = await mergeBookingOps([updated]);

  return NextResponse.json({
    success: true,
    message: "Reminder email sent successfully",
    booking: bookingWithOps,
  });
}
