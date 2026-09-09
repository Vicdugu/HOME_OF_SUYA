import { prisma } from "@/lib/prisma";
import { encryptToken, decryptToken } from "@/lib/encryption";

const SCHEMA = "malam_suya";
const TABLE = `${SCHEMA}.delivery_settings`;

interface SumUpTokenRow {
  id: string;
  sumupAccessToken: string | null;
  sumupRefreshToken: string | null;
  sumupTokenType: string | null;
  sumupTokenScope: string | null;
  sumupTokenExpiresAt: Date | null;
}

export interface SumUpStoredToken {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string | null;
  scope: string | null;
  expiresAt: Date | null;
}

export async function ensureSumUpTokenColumns(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS "sumupAccessToken" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS "sumupRefreshToken" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS "sumupTokenType" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS "sumupTokenScope" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS "sumupTokenExpiresAt" TIMESTAMP(3)`
  );
}

async function ensureSettingsRow(): Promise<{ id: string }> {
  await ensureSumUpTokenColumns();

  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM ${TABLE} ORDER BY "updatedAt" DESC NULLS LAST LIMIT 1`
  );

  if (existing[0]) {
    return existing[0];
  }

  const created = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO ${TABLE} (id, "cardiffFee", "postageFee", "postageAvailable", "minOrderCardiff", "minOrderPostage", "updatedAt")
     VALUES (gen_random_uuid()::text, 5.0, 8.0, true, 0, 0, NOW())
     RETURNING id`
  );

  return created[0];
}

export async function storeSumUpToken(token: {
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string | null;
  scope?: string | null;
  expiresIn?: number | null;
}): Promise<void> {
  const settings = await ensureSettingsRow();
  const expiresAt =
    typeof token.expiresIn === "number" && Number.isFinite(token.expiresIn)
      ? new Date(Date.now() + token.expiresIn * 1000)
      : null;

  // Encrypt tokens before storing
  const encryptedAccessToken = encryptToken(token.accessToken);
  const encryptedRefreshToken = token.refreshToken ? encryptToken(token.refreshToken) : null;

  await prisma.$executeRawUnsafe(
    `UPDATE ${TABLE}
     SET "sumupAccessToken" = $1,
         "sumupRefreshToken" = $2,
         "sumupTokenType" = $3,
         "sumupTokenScope" = $4,
         "sumupTokenExpiresAt" = $5,
         "updatedAt" = NOW()
     WHERE id = $6`,
    encryptedAccessToken,
    encryptedRefreshToken,
    token.tokenType ?? null,
    token.scope ?? null,
    expiresAt,
    settings.id
  );
}

export async function getStoredSumUpToken(): Promise<SumUpStoredToken | null> {
  await ensureSumUpTokenColumns();

  const rows = await prisma.$queryRawUnsafe<SumUpTokenRow[]>(
    `SELECT id, "sumupAccessToken", "sumupRefreshToken", "sumupTokenType", "sumupTokenScope", "sumupTokenExpiresAt"
     FROM ${TABLE}
     WHERE "sumupAccessToken" IS NOT NULL
     ORDER BY "updatedAt" DESC NULLS LAST
     LIMIT 1`
  );

  const token = rows[0];
  if (!token?.sumupAccessToken) {
    return null;
  }

  try {
    // Decrypt tokens from database
    const decryptedAccessToken = decryptToken(token.sumupAccessToken);
    const decryptedRefreshToken = token.sumupRefreshToken ? decryptToken(token.sumupRefreshToken) : null;

    return {
      accessToken: decryptedAccessToken,
      refreshToken: decryptedRefreshToken,
      tokenType: token.sumupTokenType,
      scope: token.sumupTokenScope,
      expiresAt: token.sumupTokenExpiresAt,
    };
  } catch (err) {
    console.error("[SumUp Auth] Failed to decrypt stored token:", err);
    return null;
  }
}