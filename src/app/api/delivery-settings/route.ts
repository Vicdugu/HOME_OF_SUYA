import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_DELIVERY_SETTINGS } from "@/lib/mock-data";
import { normalizeBrandImageUrl } from "@/lib/meal-photos";

export async function GET() {
  const settings =
    (await prisma.deliverySettings.findFirst()) ?? MOCK_DELIVERY_SETTINGS;
  return NextResponse.json({
    ...settings,
    logoUrl: normalizeBrandImageUrl(settings.logoUrl),
  });
}
