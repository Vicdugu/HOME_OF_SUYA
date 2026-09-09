import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TIME_SLOTS } from "@/lib/availability";
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

  // Fetch settings to get admin-configured time slots and available days
  const settings = await prisma.deliverySettings.findFirst();
  const timeSlots = settings?.timeSlots
    ? (typeof settings.timeSlots === 'string' ? JSON.parse(settings.timeSlots) : settings.timeSlots)
    : TIME_SLOTS;
  const availableDays = settings?.availableDays
    ? (typeof settings.availableDays === 'string' ? JSON.parse(settings.availableDays) : settings.availableDays)
    : [1, 2, 3, 4, 5, 6]; // Default: Monday to Saturday

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
    .filter((date) => availableDays.includes(date.getDay())) // Filter by admin-configured days
    .map((date) => buildDayAvailability(date, bookings, now, timeSlots))
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
