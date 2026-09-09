import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRequest } from "@/lib/admin-api-auth";
import { normalizeBrandLogoUrl } from "@/lib/branding-logo";

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const settings = await prisma.deliverySettings.findFirst();
  if (!settings) {
    return NextResponse.json(settings);
  }

  return NextResponse.json({
    ...settings,
    logoUrl: normalizeBrandLogoUrl(settings.logoUrl),
    timeSlots: typeof settings.timeSlots === 'string' ? JSON.parse(settings.timeSlots) : settings.timeSlots,
    availableDays: typeof settings.availableDays === 'string' ? JSON.parse(settings.availableDays) : settings.availableDays,
  });
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const data = await req.json();
  const logoUrl = normalizeBrandLogoUrl(data.logoUrl);
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
          logoUrl,
          timeSlots: data.timeSlots ? JSON.stringify(data.timeSlots) : undefined,
          availableDays: data.availableDays ? JSON.stringify(data.availableDays) : undefined,
        },
      })
    : await prisma.deliverySettings.create({
        data: {
          cardiffFee: Number(data.cardiffFee),
          postageFee: Number(data.postageFee),
          postageAvailable: Boolean(data.postageAvailable),
          minOrderCardiff: Number(data.minOrderCardiff ?? 0),
          minOrderPostage: Number(data.minOrderPostage ?? 0),
          logoUrl,
          timeSlots: data.timeSlots ? JSON.stringify(data.timeSlots) : undefined,
          availableDays: data.availableDays ? JSON.stringify(data.availableDays) : undefined,
        },
      });
  return NextResponse.json({
    ...settings,
    logoUrl: normalizeBrandLogoUrl(settings.logoUrl),
    timeSlots: typeof settings.timeSlots === 'string' ? JSON.parse(settings.timeSlots) : settings.timeSlots,
    availableDays: typeof settings.availableDays === 'string' ? JSON.parse(settings.availableDays) : settings.availableDays,
  });
}
