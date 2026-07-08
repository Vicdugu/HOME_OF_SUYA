import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_DELIVERY_SETTINGS } from "@/lib/mock-data";

export async function GET() {
  const settings =
    (await prisma.deliverySettings.findFirst()) ?? MOCK_DELIVERY_SETTINGS;
  return NextResponse.json(settings);
}
