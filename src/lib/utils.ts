import { monotonicFactory } from "ulid";

const ulid = monotonicFactory();

/**
 * Generates a human-readable booking reference: MSS-XXXXXXXX
 */
export function generateReference(): string {
  const id = ulid();
  return `MSS-${id.slice(-8).toUpperCase()}`;
}

/**
 * Returns the next 8 weeks of available booking dates
 * (Monday to Saturday = 1-6) excluding blocked dates.
 */
export function getAvailableDates(
  blockedDates: Date[],
  weeksAhead = 8
): Date[] {
  const dates: Date[] = [];
  const blockedMs = new Set(blockedDates.map((d) => toDateOnly(d).getTime()));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from tomorrow
  const start = new Date(today);
  start.setDate(start.getDate() + 1);

  const end = new Date(today);
  end.setDate(end.getDate() + weeksAhead * 7);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day === 2 || day === 4) {
      const copy = new Date(d);
      if (!blockedMs.has(toDateOnly(copy).getTime())) {
        dates.push(copy);
      }
    }
  }

  return dates;
}

export function toDateOnly(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
