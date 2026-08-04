import { prisma } from "@/lib/prisma";

export type CateringEnquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "QUOTED"
  | "BOOKED"
  | "CLOSED";

export type CateringServiceStyle =
  | "PICKUP"
  | "DELIVERY"
  | "FULL_SERVICE"
  | "UNSURE";

export interface CateringEnquiryRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  eventDate: string | null;
  guestCount: number | null;
  venue: string | null;
  budget: string | null;
  serviceStyle: CateringServiceStyle;
  deliveryArea: string | null;
  message: string;
  status: CateringEnquiryStatus;
  quoteAmount: number | null;
  quoteNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

type CateringEnquiryRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  eventDate: Date | null;
  guestCount: number | null;
  venue: string | null;
  budget: string | null;
  serviceStyle: string;
  deliveryArea: string | null;
  message: string;
  status: string;
  quoteAmount: number | null;
  quoteNotes: string | null;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function ensureCateringEnquiriesTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS catering_enquiries (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "fullName" TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      "eventDate" TIMESTAMP(3),
      "guestCount" INTEGER,
      venue TEXT,
      budget TEXT,
      "serviceStyle" TEXT NOT NULL DEFAULT 'UNSURE',
      "deliveryArea" TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NEW',
      "quoteAmount" DOUBLE PRECISION,
      "quoteNotes" TEXT,
      "adminNotes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `);
}

export function normalizeCateringStatus(value: unknown): CateringEnquiryStatus {
  switch (String(value ?? "").trim().toUpperCase()) {
    case "CONTACTED":
      return "CONTACTED";
    case "QUOTED":
      return "QUOTED";
    case "BOOKED":
      return "BOOKED";
    case "CLOSED":
      return "CLOSED";
    default:
      return "NEW";
  }
}

export function normalizeServiceStyle(value: unknown): CateringServiceStyle {
  switch (String(value ?? "").trim().toUpperCase()) {
    case "PICKUP":
      return "PICKUP";
    case "DELIVERY":
      return "DELIVERY";
    case "FULL_SERVICE":
      return "FULL_SERVICE";
    default:
      return "UNSURE";
  }
}

function toRecord(row: CateringEnquiryRow): CateringEnquiryRecord {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    eventDate: row.eventDate ? row.eventDate.toISOString().slice(0, 10) : null,
    guestCount: row.guestCount,
    venue: row.venue,
    budget: row.budget,
    serviceStyle: normalizeServiceStyle(row.serviceStyle),
    deliveryArea: row.deliveryArea,
    message: row.message,
    status: normalizeCateringStatus(row.status),
    quoteAmount: row.quoteAmount,
    quoteNotes: row.quoteNotes,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createCateringEnquiry(data: {
  fullName: string;
  email: string;
  phone: string | null;
  eventDate: Date | null;
  guestCount: number | null;
  venue: string | null;
  budget: string | null;
  serviceStyle: CateringServiceStyle;
  deliveryArea: string | null;
  message: string;
}) {
  await ensureCateringEnquiriesTable();
  const rows = await prisma.$queryRawUnsafe<CateringEnquiryRow[]>(
    `INSERT INTO catering_enquiries (
      "fullName", email, phone, "eventDate", "guestCount", venue, budget,
      "serviceStyle", "deliveryArea", message, status, "createdAt", "updatedAt"
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'NEW',NOW(),NOW())
    RETURNING *`,
    data.fullName,
    data.email.toLowerCase(),
    data.phone,
    data.eventDate,
    data.guestCount,
    data.venue,
    data.budget,
    data.serviceStyle,
    data.deliveryArea,
    data.message
  );
  return toRecord(rows[0]);
}

export async function listCateringEnquiries() {
  await ensureCateringEnquiriesTable();
  const rows = await prisma.$queryRawUnsafe<CateringEnquiryRow[]>(
    `SELECT * FROM catering_enquiries ORDER BY "createdAt" DESC`
  );
  return rows.map(toRecord);
}

export async function updateCateringEnquiry(
  id: string,
  data: {
    status?: CateringEnquiryStatus;
    quoteAmount?: number | null;
    quoteNotes?: string | null;
    adminNotes?: string | null;
  }
) {
  await ensureCateringEnquiriesTable();
  const current = await prisma.$queryRawUnsafe<CateringEnquiryRow[]>(
    `SELECT * FROM catering_enquiries WHERE id = $1 LIMIT 1`,
    id
  );
  const row = current[0];
  if (!row) {
    throw new Error("Enquiry not found");
  }
  const rows = await prisma.$queryRawUnsafe<CateringEnquiryRow[]>(
    `UPDATE catering_enquiries
     SET status = $1,
         "quoteAmount" = $2,
         "quoteNotes" = $3,
         "adminNotes" = $4,
         "updatedAt" = NOW()
     WHERE id = $5
     RETURNING *`,
    data.status ?? row.status,
    data.quoteAmount !== undefined ? data.quoteAmount : row.quoteAmount,
    data.quoteNotes !== undefined ? data.quoteNotes : row.quoteNotes,
    data.adminNotes !== undefined ? data.adminNotes : row.adminNotes,
    id
  );
  return toRecord(rows[0]);
}