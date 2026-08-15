/**
 * Client-safe availability utilities for the booking date picker.
 * No Prisma imports — safe to use in "use client" component trees.
 */

export const TIME_SLOTS = [
  { id: "14:00-16:00", label: "2:00 PM – 4:00 PM" },
  { id: "18:00-20:00", label: "6:00 PM – 8:00 PM" },
] as const;

export type TimeSlotId = (typeof TIME_SLOTS)[number]["id"];

/** Tuesday = 2, Thursday = 4 */
export function isBookableDay(date: Date): boolean {
  const d = date.getDay();
  return d === 2 || d === 4;
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
