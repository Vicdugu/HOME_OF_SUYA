import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toDateString } from "@/lib/availability";

export async function GET() {
  const blocked = await prisma.blockedDate.findMany({
    select: { date: true },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(blocked.map((b) => toDateString(b.date)));
}
