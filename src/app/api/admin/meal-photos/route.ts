import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api-auth";
import {
  getMealPhotoUrl,
  isAllowedMealPhoto,
  MAX_MEAL_PHOTO_SIZE_BYTES,
  saveMealPhoto,
} from "@/lib/meal-photos";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Meal photo file is required" }, { status: 400 });
  }

  if (!isAllowedMealPhoto(file.name)) {
    return NextResponse.json(
      { error: "Meal photo must be a JPG, JPEG, PNG, or WEBP file" },
      { status: 400 }
    );
  }

  if (file.size > MAX_MEAL_PHOTO_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Meal photo must be 5MB or smaller" },
      { status: 400 }
    );
  }

  try {
    const storedFileName = await saveMealPhoto(
      file.name,
      new Uint8Array(await file.arrayBuffer())
    );

    return NextResponse.json({
      fileName: storedFileName,
      url: getMealPhotoUrl(storedFileName),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not upload meal photo",
      },
      { status: 500 }
    );
  }
}