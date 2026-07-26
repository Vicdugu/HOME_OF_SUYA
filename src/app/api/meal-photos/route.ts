import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import {
  getMealPhotoContentType,
  getMealPhotoPath,
  isAllowedMealPhoto,
} from "@/lib/meal-photos";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("name")?.trim();

  if (!fileName || !isAllowedMealPhoto(fileName)) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  try {
    const buffer = await readFile(getMealPhotoPath(fileName));

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": getMealPhotoContentType(fileName),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }
}