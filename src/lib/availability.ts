/**
 * Client-safe availability utilities for the booking date picker.
 * No Prisma imports — safe to use in "use client" component trees.
 */

import type { DeliveryType } from "@/types";

export const TIME_SLOTS = [
  { id: "14:00-16:00", label: "2:00 PM – 4:00 PM" },
  { id: "18:00-20:00", label: "6:00 PM – 8:00 PM" },
] as const;

export type TimeSlotId = (typeof TIME_SLOTS)[number]["id"];

// Fulfillment Rule: Same-day pickup/delivery cutoff time (14:00 = 2:00 PM)
const SAME_DAY_CUTOFF_HOUR = 14;

/** Monday = 1, Tuesday = 2, Wednesday = 3, Thursday = 4, Friday = 5, Saturday = 6 */
export function isBookableDay(date: Date): boolean {
  const d = date.getDay();
  return d >= 1 && d <= 6; // Monday to Saturday
}

/** Dates must be at least 1 full day ahead (no same-day booking) */
export function isTooSoon(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date < tomorrow;
}

/** Returns a YYYY-MM-DD string in local time */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a YYYY-MM-DD string into a local Date (midnight) */
export function fromDateString(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Returns an array of Date | null representing a full calendar grid
 * for the given year/month. null entries are padding before the 1st.
 */
export function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0 = Sunday

  const days: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

/** Formats a YYYY-MM-DD string as "Tuesday, 15 July 2025" */
export function formatBookingDate(dateStr: string): string {
  const date = fromDateString(dateStr);
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Formats a time slot id like "14:00-16:00" to "2:00 PM – 4:00 PM" */
export function formatTimeSlot(slotId: string): string {
  const slot = TIME_SLOTS.find((s) => s.id === slotId);
  return slot ? slot.label : slotId;
}

/**
 * Returns the next `weeksAhead` weeks of available Tue/Thu dates,
 * excluding any in the blockedDates array.
 */
export function getAvailableDates(
  blockedDates: Date[],
  weeksAhead = 8
): Date[] {
  const dates: Date[] = [];
  const blockedMs = new Set(
    blockedDates.map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime())
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() + 1);
  const end = new Date(today);
  end.setDate(end.getDate() + weeksAhead * 7);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day === 2 || day === 4) {
      const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (!blockedMs.has(copy.getTime())) dates.push(copy);
    }
  }
  return dates;
}

/**
 * Check if same-day orders are allowed for a given delivery type at the current time
 * 
 * FULFILLMENT RULES:
 * - PICKUP and CARDIFF: Same-day cutoff is 2:00 PM (14:00)
 *   - If current time is before 2:00 PM, same-day is allowed
 *   - If current time is 2:00 PM or later, same-day is NOT allowed
 * - POSTAGE: Requires 24-hour advance processing time
 *   - Same-day is never allowed for postal orders
 */
export function canOrderSameDay(deliveryType: DeliveryType | null, now = new Date()): boolean {
  if (!deliveryType) return false;
  
  // POSTAGE never allows same-day (24-hour processing requirement)
  if (deliveryType === "POSTAGE") return false;
  
  // PICKUP and CARDIFF: check 2:00 PM cutoff
  if (deliveryType === "PICKUP" || deliveryType === "CARDIFF") {
    const currentHour = now.getHours();
    return currentHour < SAME_DAY_CUTOFF_HOUR;
  }
  
  return false;
}

/**
 * Get the earliest selectable date for a given delivery type
 * 
 * - If no delivery type selected yet: Allow today (no filtering)
 * - If same-day is allowed (before 2:00 PM for PICKUP/CARDIFF):
 *   Return today's date
 * - If same-day is NOT allowed:
 *   Return tomorrow's date
 * - For POSTAGE (24-hour rule):
 *   Return tomorrow's date (minimum 1 full day ahead)
 */
export function getEarliestSelectableDate(deliveryType: DeliveryType | null, now = new Date()): Date {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  // If no delivery type selected yet, allow same-day (full calendar available)
  if (!deliveryType) {
    return new Date(today);
  }
  
  if (canOrderSameDay(deliveryType, now)) {
    return new Date(today);
  }
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}
