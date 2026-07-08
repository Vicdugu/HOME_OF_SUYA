import { NextResponse } from "next/server";
import { MOCK_MEALS } from "@/lib/mock-data";

export async function GET() {
  // Once Neon DB is connected, replace this with:
  // const meals = await prisma.meal.findMany({ where: { isAvailable: true }, orderBy: { sortOrder: "asc" } });
  const meals = MOCK_MEALS;
  return NextResponse.json(meals);
}
