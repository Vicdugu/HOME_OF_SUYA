import { prisma } from "@/lib/prisma";

const SCHEMA = "malam_suya";
const TABLE = `${SCHEMA}.bookings`;

export type BookingFulfilmentStage =
  | "RECEIVED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED";

export type CustomerRequestType = "CANCEL" | "RESCHEDULE";
export type CustomerRequestStatus = "OPEN" | "REVIEWED" | "RESOLVED";

type BookingOpsRow = {
  id: string;
  fulfilmentStage: string | null;
  customerRequestType: string | null;
  customerRequestMessage: string | null;
  customerRequestStatus: string | null;
  customerRequestCreatedAt: Date | null;
};

export async function ensureBookingOpsColumns() {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS "fulfilmentStage" TEXT NOT NULL DEFAULT 'RECEIVED'`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS "customerRequestType" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS "customerRequestMessage" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS "customerRequestStatus" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS "customerRequestCreatedAt" TIMESTAMP(3)`
  );
  await prisma.$executeRawUnsafe(
    `UPDATE ${TABLE} SET "fulfilmentStage" = 'RECEIVED' WHERE "fulfilmentStage" IS NULL OR BTRIM("fulfilmentStage") = ''`
  );
}

export function normalizeFulfilmentStage(value: unknown): BookingFulfilmentStage {
  switch (String(value ?? "").trim().toUpperCase()) {
    case "PREPARING":
      return "PREPARING";
    case "READY":
      return "READY";
    case "OUT_FOR_DELIVERY":
      return "OUT_FOR_DELIVERY";
    case "COMPLETED":
      return "COMPLETED";
    default:
      return "RECEIVED";
  }
}

export function normalizeCustomerRequestType(value: unknown): CustomerRequestType | null {
  switch (String(value ?? "").trim().toUpperCase()) {
    case "CANCEL":
      return "CANCEL";
    case "RESCHEDULE":
      return "RESCHEDULE";
    default:
      return null;
  }
}

export function normalizeCustomerRequestStatus(value: unknown): CustomerRequestStatus | null {
  switch (String(value ?? "").trim().toUpperCase()) {
    case "OPEN":
      return "OPEN";
    case "REVIEWED":
      return "REVIEWED";
    case "RESOLVED":
      return "RESOLVED";
    default:
      return null;
  }
}

export async function getBookingOpsMap(ids: string[]) {
  await ensureBookingOpsColumns();

  if (ids.length === 0) {
    return new Map<string, {
      fulfilmentStage: BookingFulfilmentStage;
      customerRequestType: CustomerRequestType | null;
      customerRequestMessage: string | null;
      customerRequestStatus: CustomerRequestStatus | null;
      customerRequestCreatedAt: string | null;
    }>();
  }

  const rows = await prisma.$queryRawUnsafe<BookingOpsRow[]>(
    `SELECT id, "fulfilmentStage", "customerRequestType", "customerRequestMessage", "customerRequestStatus", "customerRequestCreatedAt"
     FROM ${TABLE}
     WHERE id = ANY($1)`,
    ids
  );

  return new Map(
    rows.map((row) => [
      row.id,
      {
        fulfilmentStage: normalizeFulfilmentStage(row.fulfilmentStage),
        customerRequestType: normalizeCustomerRequestType(row.customerRequestType),
        customerRequestMessage: row.customerRequestMessage,
        customerRequestStatus: normalizeCustomerRequestStatus(row.customerRequestStatus),
        customerRequestCreatedAt: row.customerRequestCreatedAt ? row.customerRequestCreatedAt.toISOString() : null,
      },
    ])
  );
}

export async function mergeBookingOps<T extends { id: string }>(bookings: T[]) {
  const opsMap = await getBookingOpsMap(bookings.map((booking) => booking.id));
  return bookings.map((booking) => ({
    ...booking,
    fulfilmentStage: opsMap.get(booking.id)?.fulfilmentStage ?? "RECEIVED",
    customerRequestType: opsMap.get(booking.id)?.customerRequestType ?? null,
    customerRequestMessage: opsMap.get(booking.id)?.customerRequestMessage ?? null,
    customerRequestStatus: opsMap.get(booking.id)?.customerRequestStatus ?? null,
    customerRequestCreatedAt: opsMap.get(booking.id)?.customerRequestCreatedAt ?? null,
  }));
}

export async function updateBookingOps(
  id: string,
  data: {
    fulfilmentStage?: BookingFulfilmentStage | null;
    customerRequestType?: CustomerRequestType | null;
    customerRequestMessage?: string | null;
    customerRequestStatus?: CustomerRequestStatus | null;
    customerRequestCreatedAt?: Date | null;
  }
) {
  await ensureBookingOpsColumns();

  const currentRows = await prisma.$queryRawUnsafe<BookingOpsRow[]>(
    `SELECT id, "fulfilmentStage", "customerRequestType", "customerRequestMessage", "customerRequestStatus", "customerRequestCreatedAt"
     FROM ${TABLE} WHERE id = $1 LIMIT 1`,
    id
  );
  const current = currentRows[0];

  await prisma.$executeRawUnsafe(
    `UPDATE ${TABLE}
     SET "fulfilmentStage" = $1,
         "customerRequestType" = $2,
         "customerRequestMessage" = $3,
         "customerRequestStatus" = $4,
         "customerRequestCreatedAt" = $5
     WHERE id = $6`,
    data.fulfilmentStage ?? current?.fulfilmentStage ?? "RECEIVED",
    data.customerRequestType !== undefined ? data.customerRequestType : current?.customerRequestType ?? null,
    data.customerRequestMessage !== undefined ? data.customerRequestMessage : current?.customerRequestMessage ?? null,
    data.customerRequestStatus !== undefined ? data.customerRequestStatus : current?.customerRequestStatus ?? null,
    data.customerRequestCreatedAt !== undefined ? data.customerRequestCreatedAt : current?.customerRequestCreatedAt ?? null,
    id
  );
}