import { NextResponse } from "next/server";
import {
  getMealPhotoContentType,
  isAllowedMealPhoto,
  readMealPhoto,
} from "@/lib/meal-photos";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const { searchParams } = new URL(req.url, baseUrl);
  const fileName = searchParams.get("name")?.trim();
  const quality = searchParams.get("quality") || "80"; // Quality 0-100, default 80

  if (!fileName || !isAllowedMealPhoto(fileName)) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  try {
    const buffer = await readMealPhoto(fileName);
    const contentType = getMealPhotoContentType(fileName);
    
    // Convert Uint8Array to a format Response accepts
    const data = new Uint8Array(buffer) as any;
    
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Length": data.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }
}