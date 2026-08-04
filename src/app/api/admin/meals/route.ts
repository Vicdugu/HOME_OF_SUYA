import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRequest } from "@/lib/admin-api-auth";
import {
  mergeMealMetadata,
  normalizeSpiceLevel,
  normalizeStockStatus,
  saveMealMetadata,
} from "@/lib/meal-metadata";
import { getDefaultMealPhotoUrl, normalizeMealImageUrl } from "@/lib/meal-photos";

const HIDDEN_LEGACY_MEAL_NAMES = new Set(["Suya Beef"]);

type VariationSelectionType = "SINGLE" | "MULTIPLE";

function parseVariationGroups(value: unknown) {
  if (value == null) {
    return {
      groups: [] as Array<{
        name: string;
        selectionType: VariationSelectionType;
        sortOrder: number;
        options: Array<{ name: string; price: number; sortOrder: number }>;
      }>,
    };
  }

  if (!Array.isArray(value)) {
    return { error: "Variation groups must be an array" };
  }

  const groups = [] as Array<{
    name: string;
    selectionType: VariationSelectionType;
    sortOrder: number;
    options: Array<{ name: string; price: number; sortOrder: number }>;
  }>;

  for (const [index, rawGroup] of value.entries()) {
    if (!rawGroup || typeof rawGroup !== "object") {
      return { error: `Variation group ${index + 1} is invalid` };
    }

    const group = rawGroup as Record<string, unknown>;
    const name = String(group.name ?? "").trim();
    const selectionType = group.selectionType === "MULTIPLE" ? "MULTIPLE" : "SINGLE";
    const sortOrder = Number(group.sortOrder ?? index);

    if (!name) {
      return { error: `Variation group ${index + 1} needs a name` };
    }

    if (!Number.isFinite(sortOrder)) {
      return { error: `Variation group ${name} has an invalid sort order` };
    }

    if (!Array.isArray(group.options)) {
      return { error: `Variation group ${name} must include an options array` };
    }

    const options = group.options
      .map((rawOption, optionIndex) => {
        if (!rawOption || typeof rawOption !== "object") {
          return null;
        }

        const option = rawOption as Record<string, unknown>;
        const optionName = String(option.name ?? "").trim();
        const optionPrice = Number(option.price ?? 0);
        const optionSortOrder = Number(option.sortOrder ?? optionIndex);

        if (!optionName || !Number.isFinite(optionPrice) || optionPrice < 0 || !Number.isFinite(optionSortOrder)) {
          return null;
        }

        return { name: optionName, price: optionPrice, sortOrder: optionSortOrder };
      })
      .filter((option): option is { name: string; price: number; sortOrder: number } => option !== null);

    if (options.length === 0) {
      return { error: `Variation group ${name} must include at least one option` };
    }

    groups.push({ name, selectionType, sortOrder, options });
  }

  return { groups };
}

function parseMealInput(data: Record<string, unknown>) {
  const name = String(data.name ?? "").trim();
  const description = String(data.description ?? "").trim();
  const price = Number(data.price);
  const sortOrder = Number(data.sortOrder ?? 0);
  const imageUrl = String(data.imageUrl ?? "").trim();
  const allergenInfoRaw = String(data.allergenInfo ?? "").trim();
  const spiceLevel = normalizeSpiceLevel(data.spiceLevel);
  const stockStatus = normalizeStockStatus(data.stockStatus);
  const variationGroups = parseVariationGroups(data.variationGroups);

  if (!name) {
    return { error: "Meal name is required" };
  }

  if (!Number.isFinite(price) || price < 0) {
    return { error: "Meal price cannot be negative" };
  }

  if (!("error" in variationGroups) && variationGroups.groups.length === 0 && price <= 0) {
    return { error: "Price must be greater than 0 when no variations are configured" };
  }

  if (!Number.isFinite(sortOrder)) {
    return { error: "Sort order must be a number" };
  }

  if ("error" in variationGroups) {
    return { error: variationGroups.error };
  }

  return {
    data: {
      name,
      description,
      price,
      imageUrl: imageUrl || getDefaultMealPhotoUrl(),
      isAvailable: Boolean(data.isAvailable ?? true) && stockStatus !== "SOLD_OUT",
      sortOrder,
      allergenInfo: allergenInfoRaw || null,
      spiceLevel,
      stockStatus,
    },
    variationGroups: variationGroups.groups,
  };
}

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

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
  const mealsWithMetadata = await mergeMealMetadata(
    meals.filter((meal) => !HIDDEN_LEGACY_MEAL_NAMES.has(meal.name))
  );
  return NextResponse.json(
    mealsWithMetadata.map((meal) => ({
      ...meal,
      imageUrl: normalizeMealImageUrl(meal.imageUrl),
    }))
  );
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const payload = parseMealInput(await req.json());
  if ("error" in payload) {
    return NextResponse.json({ error: payload.error }, { status: 400 });
  }

  const meal = await prisma.meal.create({
    data: {
      name: payload.data.name,
      description: payload.data.description,
      price: payload.data.price,
      imageUrl: payload.data.imageUrl,
      isAvailable: payload.data.isAvailable,
      sortOrder: payload.data.sortOrder,
      variationGroups: {
        create: payload.variationGroups.map((group) => ({
          name: group.name,
          selectionType: group.selectionType,
          sortOrder: group.sortOrder,
          options: {
            create: group.options.map((option) => ({
              name: option.name,
              price: option.price,
              sortOrder: option.sortOrder,
            })),
          },
        })),
      },
    },
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
  await saveMealMetadata(meal.id, {
    allergenInfo: payload.data.allergenInfo,
    spiceLevel: payload.data.spiceLevel,
    stockStatus: payload.data.stockStatus,
  });
  const [mealWithMetadata] = await mergeMealMetadata([meal]);
  return NextResponse.json(mealWithMetadata, { status: 201 });
}
