import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRequest } from "@/lib/admin-api-auth";
import {
  isAllowedBrandLogo,
  MAX_BRAND_LOGO_SIZE_BYTES,
  toBrandLogoDataUrl,
} from "@/lib/branding-logo";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Logo file is required" }, { status: 400 });
  }

  if (!isAllowedBrandLogo(file.name)) {
    return NextResponse.json({ error: "Logo must be a PNG, JPG, JPEG, or SVG file" }, { status: 400 });
  }

  if (file.size > MAX_BRAND_LOGO_SIZE_BYTES) {
    return NextResponse.json({ error: "Logo must be 2MB or smaller" }, { status: 400 });
  }

  const logoUrl = toBrandLogoDataUrl(
    file.name,
    new Uint8Array(await file.arrayBuffer())
  );
  const existing = await prisma.deliverySettings.findFirst();

  if (existing) {
    await prisma.deliverySettings.update({
      where: { id: existing.id },
      data: { logoUrl },
    });
  } else {
    await prisma.deliverySettings.create({
      data: { logoUrl },
    });
  }

  return NextResponse.json({ logoUrl });
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const existing = await prisma.deliverySettings.findFirst();
  if (existing) {
    await prisma.deliverySettings.update({
      where: { id: existing.id },
      data: { logoUrl: null },
    });
  }

  return NextResponse.json({ logoUrl: null });
}