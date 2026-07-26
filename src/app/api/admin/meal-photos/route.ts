import { readdir } from "node:fs/promises";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api-auth";
import {
  getMealPhotosDirectory,
  getMealPhotoUrl,
  isAllowedMealPhoto,
} from "@/lib/meal-photos";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  try {
    const entries = await readdir(getMealPhotosDirectory(), { withFileTypes: true });
    const photos = entries
      .filter((entry) => entry.isFile() && isAllowedMealPhoto(entry.name))
      .map((entry) => ({
        name: entry.name,
        url: getMealPhotoUrl(entry.name),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    return NextResponse.json(photos);
  } catch {
    return NextResponse.json([]);
  }
}