import { NextResponse } from "next/server";
import { MOCK_BLOCKED_DATES } from "@/lib/mock-data";
import { getAvailableDates, toDateString } from "@/lib/availability";

export async function GET() {
  // Once DB is connected, replace with:
  // const blocked = await prisma.blockedDate.findMany({ select: { date: true } });
  // const blockedDates = blocked.map(b => b.date);
  const blockedDates = MOCK_BLOCKED_DATES.map((s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  });

  const dates = getAvailableDates(blockedDates, 10);
  return NextResponse.json(dates.map((d) => toDateString(d)));
}
