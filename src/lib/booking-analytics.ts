import { prisma } from "@/lib/prisma";

const SCHEMA = "malam_suya";
const TABLE = `${SCHEMA}.booking_analytics_events`;

export async function ensureAnalyticsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      event_name TEXT NOT NULL,
      page TEXT,
      reference TEXT,
      metadata JSONB,
      created_at TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `);
}

export async function logBookingEvent(data: {
  eventName: string;
  page?: string | null;
  reference?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await ensureAnalyticsTable();
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${TABLE} (event_name, page, reference, metadata)
     VALUES ($1, $2, $3, $4::jsonb)`,
    data.eventName,
    data.page ?? null,
    data.reference ?? null,
    JSON.stringify(data.metadata ?? {})
  );
}