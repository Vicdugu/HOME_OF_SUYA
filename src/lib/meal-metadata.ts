import { prisma } from "@/lib/prisma";

export type MealStockStatus = "IN_STOCK" | "LOW_STOCK" | "SOLD_OUT";
export type MealSpiceLevel = "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT" | "NOT_SPICY";

type MealMetadataRow = {
  id: string;
  allergenInfo: string | null;
  spiceLevel: string | null;
  stockStatus: string | null;
};

export async function ensureMealMetadataColumns() {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE meals ADD COLUMN IF NOT EXISTS "allergenInfo" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE meals ADD COLUMN IF NOT EXISTS "spiceLevel" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE meals ADD COLUMN IF NOT EXISTS "stockStatus" TEXT NOT NULL DEFAULT 'IN_STOCK'`
  );
  await prisma.$executeRawUnsafe(
    `UPDATE meals SET "stockStatus" = 'IN_STOCK' WHERE "stockStatus" IS NULL OR BTRIM("stockStatus") = ''`
  );
}

export function normalizeStockStatus(value: unknown): MealStockStatus {
  switch (String(value ?? "").trim().toUpperCase()) {
    case "LOW_STOCK":
      return "LOW_STOCK";
    case "SOLD_OUT":
      return "SOLD_OUT";
    default:
      return "IN_STOCK";
  }
}

export function normalizeSpiceLevel(value: unknown): MealSpiceLevel | null {
  switch (String(value ?? "").trim().toUpperCase()) {
    case "NOT_SPICY":
      return "NOT_SPICY";
    case "MILD":
      return "MILD";
    case "MEDIUM":
      return "MEDIUM";
    case "HOT":
      return "HOT";
    case "EXTRA_HOT":
      return "EXTRA_HOT";
    default:
      return null;
  }
}

export async function getMealMetadataMap(mealIds: string[]) {
  await ensureMealMetadataColumns();

  if (mealIds.length === 0) {
    return new Map<string, { allergenInfo: string | null; spiceLevel: MealSpiceLevel | null; stockStatus: MealStockStatus }>();
  }

  const rows = await prisma.$queryRawUnsafe<MealMetadataRow[]>(
    `SELECT id, "allergenInfo", "spiceLevel", "stockStatus" FROM meals WHERE id = ANY($1)`,
    mealIds
  );

  return new Map(
    rows.map((row) => [
      row.id,
      {
        allergenInfo: row.allergenInfo,
        spiceLevel: normalizeSpiceLevel(row.spiceLevel),
        stockStatus: normalizeStockStatus(row.stockStatus),
      },
    ])
  );
}

export async function mergeMealMetadata<T extends { id: string; isAvailable: boolean }>(meals: T[]) {
  const metadataMap = await getMealMetadataMap(meals.map((meal) => meal.id));
  return meals.map((meal) => {
    const metadata = metadataMap.get(meal.id);
    const stockStatus = metadata?.stockStatus ?? "IN_STOCK";

    return {
      ...meal,
      allergenInfo: metadata?.allergenInfo ?? null,
      spiceLevel: metadata?.spiceLevel ?? null,
      stockStatus,
      isAvailable: meal.isAvailable && stockStatus !== "SOLD_OUT",
    };
  });
}

export async function saveMealMetadata(
  id: string,
  data: { allergenInfo: string | null; spiceLevel: MealSpiceLevel | null; stockStatus: MealStockStatus }
) {
  await ensureMealMetadataColumns();
  await prisma.$executeRawUnsafe(
    `UPDATE meals
     SET "allergenInfo" = $1,
         "spiceLevel" = $2,
         "stockStatus" = $3,
         "isAvailable" = CASE WHEN $3 = 'SOLD_OUT' THEN false ELSE "isAvailable" END
     WHERE id = $4`,
    data.allergenInfo,
    data.spiceLevel,
    data.stockStatus,
    id
  );
}