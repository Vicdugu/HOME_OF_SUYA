import { NextResponse } from "next/server";
import { getBrandLogoContentType, readStoredBrandLogo } from "@/lib/branding-logo";

export const runtime = "nodejs";

export async function GET() {
  const logo = await readStoredBrandLogo();

  if (!logo) {
    return NextResponse.json({ error: "Logo not found" }, { status: 404 });
  }

  return new NextResponse(logo.content, {
    headers: {
      "Content-Type": getBrandLogoContentType(logo.fileName),
      "Cache-Control": "public, max-age=3600",
    },
  });
}