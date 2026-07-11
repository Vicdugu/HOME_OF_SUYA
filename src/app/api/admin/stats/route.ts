import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [totalBookings, pendingBookings, confirmedBookings, meals, revenueAgg] =
    await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.meal.count({ where: { isAvailable: true } }),
      prisma.booking.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "PAID" },
      }),
    ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayBookings = await prisma.booking.count({
    where: { createdAt: { gte: todayStart } },
  });

  return NextResponse.json({
    totalBookings,
    pendingBookings,
    confirmedBookings,
    todayBookings,
    activeMeals: meals,
    totalRevenue: revenueAgg._sum.total ?? 0,
  });
}
