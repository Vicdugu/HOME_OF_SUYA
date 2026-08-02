import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_DELIVERY_SETTINGS } from "@/lib/delivery-settings";
import { normalizeBrandImageUrl } from "@/lib/meal-photos";

export async function GET() {
  const settings =
    (await prisma.deliverySettings.findFirst()) ?? DEFAULT_DELIVERY_SETTINGS;
  return NextResponse.json({
    ...settings,
    logoUrl: normalizeBrandImageUrl(settings.logoUrl),
  });
}
