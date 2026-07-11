import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.deliverySettings.findFirst();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  const existing = await prisma.deliverySettings.findFirst();
  const settings = existing
    ? await prisma.deliverySettings.update({
        where: { id: existing.id },
        data: {
          cardiffFee: Number(data.cardiffFee),
          postageFee: Number(data.postageFee),
          postageAvailable: Boolean(data.postageAvailable),
          minOrderCardiff: Number(data.minOrderCardiff ?? 0),
          minOrderPostage: Number(data.minOrderPostage ?? 0),
        },
      })
    : await prisma.deliverySettings.create({ data });
  return NextResponse.json(settings);
}
