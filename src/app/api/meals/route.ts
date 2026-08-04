import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mergeMealMetadata } from "@/lib/meal-metadata";
import { normalizeMealImageUrl } from "@/lib/meal-photos";

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
  const mealsWithMetadata = await mergeMealMetadata(meals);
  return NextResponse.json(
    mealsWithMetadata.map((meal) => ({
      ...meal,
      imageUrl: normalizeMealImageUrl(meal.imageUrl),
    }))
  );
}
