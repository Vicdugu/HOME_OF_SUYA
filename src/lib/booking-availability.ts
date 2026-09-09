import { TIME_SLOTS, fromDateString, isBookableDay, toDateString } from "@/lib/availability";
import type { DeliveryType, PaymentStatus } from "@/types";

export const BOOKING_CUTOFF_HOUR_LOCAL = 18;
export const UNPAID_BOOKING_HOLD_MINUTES = 30;

export const SLOT_CAPACITY_BY_DELIVERY: Record<string, Record<DeliveryType, number>> = {
  "14:00-16:00": { PICKUP: 8, CARDIFF: 8, POSTAGE: 10 },
  "18:00-20:00": { PICKUP: 6, CARDIFF: 7, POSTAGE: 9 },
};

type BookingCapacityRecord = {
  bookingDate: Date;
  timeSlot: string;
  deliveryType: DeliveryType;
  status: string;
  paymentStatus: PaymentStatus;
  createdAt: Date;
};

export type SlotAvailabilitySnapshot = {
  id: string;
  label: string;
  remainingByDelivery: Record<DeliveryType, number>;
  capacityByDelivery: Record<DeliveryType, number>;
};

export type DayAvailabilitySnapshot = {
  date: string;
  cutoffAt: string;
  slots: SlotAvailabilitySnapshot[];
};

function getHoldExpiry(now: Date) {
  return new Date(now.getTime() - UNPAID_BOOKING_HOLD_MINUTES * 60 * 1000);
}

export function getBookingCutoff(date: Date) {
  const cutoff = new Date(date);
  cutoff.setDate(cutoff.getDate() - 1);
  cutoff.setHours(BOOKING_CUTOFF_HOUR_LOCAL, 0, 0, 0);
  return cutoff;
}

export function isBookingWindowOpen(date: Date, now = new Date()) {
  if (!isBookableDay(date)) {
    return false;
  }

  const bookingDate = new Date(date);
  bookingDate.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (bookingDate <= today) {
    return false;
  }

  return now < getBookingCutoff(bookingDate);
}

export function isBookingCountedForCapacity(
  booking: Pick<BookingCapacityRecord, "status" | "paymentStatus" | "createdAt">,
  now = new Date()
) {
  if (booking.status === "CANCELLED") {
    return false;
  }

  if (booking.paymentStatus === "PAID") {
    return true;
  }

  return booking.createdAt >= getHoldExpiry(now);
}

export function buildDayAvailability(
  date: Date,
  bookings: BookingCapacityRecord[],
  now = new Date(),
  timeSlots = TIME_SLOTS
): DayAvailabilitySnapshot {
  const dateKey = toDateString(date);

  return {
    date: dateKey,
    cutoffAt: getBookingCutoff(date).toISOString(),
    slots: timeSlots.map((slot) => {
      const capacityByDelivery = SLOT_CAPACITY_BY_DELIVERY[slot.id] ?? {
        PICKUP: 0,
        CARDIFF: 0,
        POSTAGE: 0,
      };

      const remainingByDelivery = {
        PICKUP: capacityByDelivery.PICKUP,
        CARDIFF: capacityByDelivery.CARDIFF,
        POSTAGE: capacityByDelivery.POSTAGE,
      };

      for (const booking of bookings) {
        if (
          toDateString(booking.bookingDate) !== dateKey ||
          booking.timeSlot !== slot.id ||
          !isBookingCountedForCapacity(booking, now)
        ) {
          continue;
        }

        remainingByDelivery[booking.deliveryType] = Math.max(
          0,
          remainingByDelivery[booking.deliveryType] - 1
        );
      }

      return {
        id: slot.id,
        label: slot.label,
        remainingByDelivery,
        capacityByDelivery,
      };
    }),
  };
}

export function hasAnyRemainingCapacity(day: DayAvailabilitySnapshot) {
  return day.slots.some(
    (slot) =>
      slot.remainingByDelivery.PICKUP > 0 ||
      slot.remainingByDelivery.CARDIFF > 0 ||
      slot.remainingByDelivery.POSTAGE > 0
  );
}

export function getSlotRemainingCapacity(
  day: DayAvailabilitySnapshot,
  timeSlot: string,
  deliveryType: DeliveryType
) {
  const slot = day.slots.find((entry) => entry.id === timeSlot);
  if (!slot) {
    return 0;
  }

  return slot.remainingByDelivery[deliveryType] ?? 0;
}

export function getBookableDatesForRange(weeksAhead = 10, now = new Date()) {
  const dates: Date[] = [];
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setDate(end.getDate() + weeksAhead * 7);

  for (let current = new Date(today); current <= end; current.setDate(current.getDate() + 1)) {
    const date = new Date(current.getFullYear(), current.getMonth(), current.getDate());
    if (isBookingWindowOpen(date, now)) {
      dates.push(date);
    }
  }

  return dates;
}

export function parseBookingDateOrNull(dateString: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }

  const date = fromDateString(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}