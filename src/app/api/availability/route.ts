import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  BOOKING_CUTOFF_HOUR_LOCAL,
  UNPAID_BOOKING_HOLD_MINUTES,
  buildDayAvailability,
  getBookableDatesForRange,
  hasAnyRemainingCapacity,
} from "@/lib/booking-availability";

export async function GET() {
  const now = new Date();
  const candidateDates = getBookableDatesForRange(10, now);

  const blocked = await prisma.blockedDate.findMany({ select: { date: true } });
  const blockedSet = new Set(
    blocked.map((entry) => new Date(entry.date.getFullYear(), entry.date.getMonth(), entry.date.getDate()).getTime())
  );

  const startDate = candidateDates[0];
  const endDate = candidateDates[candidateDates.length - 1];

  const bookings = startDate && endDate
    ? await prisma.booking.findMany({
        where: {
          bookingDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          bookingDate: true,
          timeSlot: true,
          deliveryType: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
        },
      })
    : [];

  const days = candidateDates
    .filter((date) => !blockedSet.has(date.getTime()))
    .map((date) => buildDayAvailability(date, bookings, now))
    .filter(hasAnyRemainingCapacity);

  return NextResponse.json({
    generatedAt: now.toISOString(),
    rules: {
      unpaidHoldMinutes: UNPAID_BOOKING_HOLD_MINUTES,
      cutoffHourLocal: BOOKING_CUTOFF_HOUR_LOCAL,
    },
    days,
  });
}
