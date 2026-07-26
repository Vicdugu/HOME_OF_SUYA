import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const meals = await prisma.meal.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      variationGroups: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
  return NextResponse.json(meals);
}
