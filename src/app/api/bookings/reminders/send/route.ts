/**
 * Background job: Send booking reminder emails for PENDING bookings after 30 minutes
 *
 * Triggered by external cron service or internal job scheduler.
 * Secured with CRON_SECRET environment variable.
 *
 * POST /api/bookings/reminders/send
 * Headers: { "X-Cron-Secret": process.env.CRON_SECRET }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingReminderEmail } from "@/lib/email";
import type { BookingNotificationData } from "@/lib/whatsapp";

const REMINDER_DELAY_MINUTES = 30;

export async function POST(req: NextRequest) {
  // Verify cron secret
  const cronSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - REMINDER_DELAY_MINUTES * 60_000);

    // Find pending bookings created 30+ minutes ago that haven't received a reminder yet
    const pendingBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        reminderEmailSentAt: null,
        createdAt: {
          lte: thirtyMinutesAgo,
        },
      },
      include: {
        items: {
          select: {
            mealName: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    });

    console.log(`[Cron] Found ${pendingBookings.length} pending bookings to send reminders for`);

    if (pendingBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending bookings found",
        sent: 0,
        failed: 0,
      });
    }

    let sent = 0;
    let failed = 0;

    // Send reminder for each booking
    for (const booking of pendingBookings) {
      try {
        if (!booking.email) {
          console.warn(`[Cron] Booking ${booking.reference} has no email, skipping`);
          failed++;
          continue;
        }

        // Build payment link - direct to booking payment page with reference
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://homeofsuya.com";
        const paymentLink = `${baseUrl}/payment?ref=${booking.reference}`;

        // Format booking date for email
        const bookingDateStr = booking.bookingDate.toLocaleDateString("en-GB", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        const notificationData: BookingNotificationData & { paymentLink: string } = {
          reference: booking.reference,
          customerName: booking.customerName,
          whatsapp: booking.whatsapp,
          email: booking.email,
          address: booking.address,
          bookingDate: bookingDateStr,
          timeSlot: booking.timeSlot,
          deliveryType: booking.deliveryType,
          items: booking.items,
          subtotal: booking.subtotal,
          deliveryFee: booking.deliveryFee,
          discount: booking.discount,
          total: booking.total,
          paymentLink,
        };

        const success = await sendBookingReminderEmail(notificationData);

        if (success) {
          // Mark reminder as sent
          await prisma.booking.update({
            where: { id: booking.id },
            data: { reminderEmailSentAt: now },
          });
          sent++;
          console.log(`[Cron] Reminder sent for booking ${booking.reference}`);
        } else {
          failed++;
          console.error(`[Cron] Failed to send reminder for booking ${booking.reference}`);
        }
      } catch (error) {
        failed++;
        console.error(`[Cron] Error processing booking ${booking.reference}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reminder sending completed`,
      total: pendingBookings.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error("[Cron] Error sending booking reminders:", error);
    return NextResponse.json(
      { error: "Failed to send reminders", details: String(error) },
      { status: 500 }
    );
  }
}
