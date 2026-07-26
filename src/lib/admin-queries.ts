/**
 * Raw SQL helpers for AdminUser queries involving new fields.
 * Needed because the Prisma client was generated before the new columns
 * were added (Node v24 prevents Prisma CLI from regenerating).
 */
import { prisma } from "@/lib/prisma";
import type { AdminUserFull } from "@/types";

const SCHEMA = "malam_suya";
const TABLE = `${SCHEMA}.admin_users`;

const ALL_COLS = `id, username, "fullName", email, "passwordHash", "isVerified", role, status, "verificationToken", "verificationTokenExpiry", "resetToken", "resetTokenExpiry", "createdAt"`;

export async function ensureAdminAccountColumns(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS "fullName" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'ADMIN'`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE'`
  );
  await prisma.$executeRawUnsafe(
    `UPDATE ${TABLE} SET "fullName" = username WHERE "fullName" IS NULL OR BTRIM("fullName") = ''`
  );
  await prisma.$executeRawUnsafe(
    `UPDATE ${TABLE} SET role = 'ADMIN' WHERE role IS NULL OR BTRIM(role) = ''`
  );
  await prisma.$executeRawUnsafe(
    `UPDATE ${TABLE}
     SET status = CASE WHEN COALESCE("isVerified", true) THEN 'ACTIVE' ELSE 'PENDING' END
     WHERE status IS NULL OR BTRIM(status) = ''`
  );
}

export async function findAdminByUsername(username: string): Promise<AdminUserFull | null> {
  await ensureAdminAccountColumns();
  const rows = await prisma.$queryRawUnsafe<AdminUserFull[]>(
    `SELECT ${ALL_COLS} FROM ${TABLE} WHERE username = $1 LIMIT 1`,
    username
  );
  return rows[0] ?? null;
}

export async function findAdminByLogin(login: string): Promise<AdminUserFull | null> {
  await ensureAdminAccountColumns();
  const rows = await prisma.$queryRawUnsafe<AdminUserFull[]>(
    `SELECT ${ALL_COLS} FROM ${TABLE}
     WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)
     LIMIT 1`,
    login
  );
  return rows[0] ?? null;
}

export async function findAdminByEmail(email: string): Promise<AdminUserFull | null> {
  await ensureAdminAccountColumns();
  const rows = await prisma.$queryRawUnsafe<AdminUserFull[]>(
    `SELECT ${ALL_COLS} FROM ${TABLE} WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    email
  );
  return rows[0] ?? null;
}

export async function findAdminByVerificationToken(hashedToken: string): Promise<AdminUserFull | null> {
  await ensureAdminAccountColumns();
  const rows = await prisma.$queryRawUnsafe<AdminUserFull[]>(
    `SELECT ${ALL_COLS} FROM ${TABLE} WHERE "verificationToken" = $1 LIMIT 1`,
    hashedToken
  );
  return rows[0] ?? null;
}

export async function findAdminByResetToken(hashedToken: string): Promise<AdminUserFull | null> {
  await ensureAdminAccountColumns();
  const rows = await prisma.$queryRawUnsafe<AdminUserFull[]>(
    `SELECT ${ALL_COLS} FROM ${TABLE} WHERE "resetToken" = $1 LIMIT 1`,
    hashedToken
  );
  return rows[0] ?? null;
}

export async function findAdminById(id: string): Promise<AdminUserFull | null> {
  await ensureAdminAccountColumns();
  const rows = await prisma.$queryRawUnsafe<AdminUserFull[]>(
    `SELECT ${ALL_COLS} FROM ${TABLE} WHERE id = $1 LIMIT 1`,
    id
  );
  return rows[0] ?? null;
}

export async function adminUsernameOrEmailExists(username: string, email: string): Promise<boolean> {
  await ensureAdminAccountColumns();
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM ${TABLE} WHERE username = $1 OR LOWER(email) = LOWER($2) LIMIT 1`,
    username, email
  );
  return rows.length > 0;
}

export async function createAdminUser(data: {
  username: string;
  email: string;
  verificationToken: string;
  verificationTokenExpiry: Date;
}): Promise<{ id: string }> {
  await ensureAdminAccountColumns();
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO ${TABLE} (id, username, "fullName", email, "passwordHash", "isVerified", role, status, "verificationToken", "verificationTokenExpiry", "createdAt")
     VALUES (gen_random_uuid()::text, $1, $1, LOWER($2), NULL, false, 'ADMIN', 'PENDING', $3, $4, NOW())
     RETURNING id`,
    data.username, data.email, data.verificationToken, data.verificationTokenExpiry
  );
  return rows[0];
}

export async function createManualAdminUser(data: {
  fullName: string;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  status: string;
}): Promise<{ id: string }> {
  await ensureAdminAccountColumns();
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO ${TABLE} (id, username, "fullName", email, "passwordHash", "isVerified", role, status, "verificationToken", "verificationTokenExpiry", "resetToken", "resetTokenExpiry", "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, LOWER($3), $4, true, $5, $6, NULL, NULL, NULL, NULL, NOW())
     RETURNING id`,
    data.username,
    data.fullName,
    data.email,
    data.passwordHash,
    data.role,
    data.status
  );
  return rows[0];
}

export async function activateAdminUser(id: string, passwordHash: string): Promise<void> {
  await ensureAdminAccountColumns();
  await prisma.$executeRawUnsafe(
    `UPDATE ${TABLE} SET "passwordHash" = $1, "isVerified" = true, status = 'ACTIVE', "verificationToken" = NULL, "verificationTokenExpiry" = NULL WHERE id = $2`,
    passwordHash, id
  );
}

export async function setAdminResetToken(id: string, hashedToken: string, expiry: Date): Promise<void> {
  await ensureAdminAccountColumns();
  await prisma.$executeRawUnsafe(
    `UPDATE ${TABLE} SET "resetToken" = $1, "resetTokenExpiry" = $2 WHERE id = $3`,
    hashedToken, expiry, id
  );
}

export async function resetAdminPassword(id: string, passwordHash: string): Promise<void> {
  await ensureAdminAccountColumns();
  await prisma.$executeRawUnsafe(
    `UPDATE ${TABLE} SET "passwordHash" = $1, "resetToken" = NULL, "resetTokenExpiry" = NULL WHERE id = $2`,
    passwordHash, id
  );
}

export async function refreshAdminVerificationToken(
  id: string,
  hashedToken: string,
  expiry: Date
): Promise<void> {
  await ensureAdminAccountColumns();
  await prisma.$executeRawUnsafe(
    `UPDATE ${TABLE} SET "verificationToken" = $1, "verificationTokenExpiry" = $2 WHERE id = $3`,
    hashedToken, expiry, id
  );
}

export async function listAllAdmins(): Promise<
  Pick<AdminUserFull, "id" | "username" | "fullName" | "email" | "role" | "status" | "isVerified" | "createdAt">[]
> {
  await ensureAdminAccountColumns();
  return prisma.$queryRawUnsafe(
    `SELECT id, username, "fullName", email, role, status, "isVerified", "createdAt" FROM ${TABLE} ORDER BY "createdAt" DESC`
  );
}
