import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRequest } from "@/lib/admin-api-auth";
import { toDateString } from "@/lib/availability";

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const dates = await prisma.blockedDate.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(
    dates.map((d) => ({ id: d.id, date: toDateString(d.date), reason: d.reason }))
  );
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { date, reason } = await req.json();
  const [y, m, d] = date.split("-").map(Number);
  const blocked = await prisma.blockedDate.create({
    data: { date: new Date(y, m - 1, d), reason: reason || null },
  });
  return NextResponse.json({ id: blocked.id, date, reason: blocked.reason });
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id } = await req.json();
  await prisma.blockedDate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
