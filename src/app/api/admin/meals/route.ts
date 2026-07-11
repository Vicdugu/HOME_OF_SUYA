import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const meals = await prisma.meal.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(meals);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const meal = await prisma.meal.create({
    data: {
      name: data.name,
      description: data.description,
      price: Number(data.price),
      imageUrl: data.imageUrl || "/images/meals/placeholder.jpg",
      isAvailable: data.isAvailable ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });
  return NextResponse.json(meal, { status: 201 });
}
