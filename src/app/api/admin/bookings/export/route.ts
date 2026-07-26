import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRequest } from "@/lib/admin-api-auth";

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const headers = [
    "Reference",
    "Date Created",
    "Booking Date",
    "Time Slot",
    "Status",
    "Payment",
    "Customer",
    "WhatsApp",
    "Email",
    "Delivery",
    "Address",
    "Items",
    "Subtotal",
    "Delivery Fee",
    "Discount",
    "Total",
    "Notes",
  ];

  const rows = bookings.map((b) => [
    b.reference,
    b.createdAt.toISOString().slice(0, 10),
    b.bookingDate.toISOString().slice(0, 10),
    b.timeSlot,
    b.status,
    b.paymentStatus,
    b.customerName,
    b.whatsapp,
    b.email ?? "",
    b.deliveryType,
    (b.address ?? "").replace(/\n/g, " "),
    b.items.map((i) => `${i.mealName}x${i.quantity}`).join("; "),
    b.subtotal.toFixed(2),
    b.deliveryFee.toFixed(2),
    b.discount.toFixed(2),
    b.total.toFixed(2),
    (b.notes ?? "").replace(/\n/g, " "),
  ]);

  const escape = (v: string) =>
    `"${String(v).replace(/"/g, '""')}"`;

  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
