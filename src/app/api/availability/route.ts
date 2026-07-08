import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableDates, toDateString } from "@/lib/availability";

export async function GET() {
  const blocked = await prisma.blockedDate.findMany({ select: { date: true } });
  const blockedDates = blocked.map((b) => b.date);
  const dates = getAvailableDates(blockedDates, 10);
  return NextResponse.json(dates.map((d) => toDateString(d)));
}
