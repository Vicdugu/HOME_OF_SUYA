import { prisma } from "@/lib/prisma";

const SCHEMA = "malam_suya";
const TABLE = `${SCHEMA}.promo_codes`;

type PromoCodeVisibilityRow = {
  id: string;
  isHidden: boolean | null;
};

export async function ensurePromoCodeVisibilityColumn() {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false`
  );
  await prisma.$executeRawUnsafe(
    `UPDATE ${TABLE} SET "isHidden" = false WHERE "isHidden" IS NULL`
  );
}

export async function getPromoCodeVisibilityMap(ids: string[]) {
  await ensurePromoCodeVisibilityColumn();

  if (ids.length === 0) {
    return new Map<string, boolean>();
  }

  const rows = await prisma.$queryRawUnsafe<PromoCodeVisibilityRow[]>(
    `SELECT id, "isHidden" FROM ${TABLE} WHERE id = ANY($1)`,
    ids
  );

  return new Map(rows.map((row) => [row.id, Boolean(row.isHidden)]));
}

export async function mergePromoCodeVisibility<T extends { id: string }>(codes: T[]) {
  const visibilityMap = await getPromoCodeVisibilityMap(codes.map((code) => code.id));
  return codes.map((code) => ({
    ...code,
    isHidden: visibilityMap.get(code.id) ?? false,
  }));
}

export async function setPromoCodeHidden(id: string, isHidden: boolean) {
  await ensurePromoCodeVisibilityColumn();
  await prisma.$executeRawUnsafe(
    `UPDATE ${TABLE} SET "isHidden" = $1 WHERE id = $2`,
    isHidden,
    id
  );
}