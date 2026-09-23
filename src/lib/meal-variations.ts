import type {
  CartItem,
  CartItemSelection,
  MealDTO,
  MealVariationGroupDTO,
  MealVariationSelection,
} from "@/types";

function getNormalizedOptionIds(
  group: MealVariationGroupDTO,
  selection: MealVariationSelection
) {
  const selectedIds = Array.isArray(selection[group.id]) ? selection[group.id] : [];
  const validIds = group.options
    .map((option) => option.id)
    .filter((optionId) => selectedIds.includes(optionId));

  if (group.selectionType === "SINGLE") {
    if (validIds.length > 0) {
      return [validIds[0]];
    }

    return group.options[0] ? [group.options[0].id] : [];
  }

  return Array.from(new Set(validIds));
}

export function createInitialMealSelection(
  meal: Pick<MealDTO, "variationGroups">
): MealVariationSelection {
  return meal.variationGroups.reduce<MealVariationSelection>((selection, group) => {
    selection[group.id] = [];
    return selection;
  }, {});
}

export function buildCartSelections(
  meal: Pick<MealDTO, "variationGroups">,
  selection: MealVariationSelection
): CartItemSelection[] {
  return meal.variationGroups
    .map((group) => {
      const optionIds = getNormalizedOptionIds(group, selection);
      const optionNames = group.options
        .filter((option) => optionIds.includes(option.id))
        .map((option) => option.name);

      if (optionNames.length === 0) {
        return null;
      }

      return {
        groupId: group.id,
        groupName: group.name,
        selectionType: group.selectionType,
        optionIds,
        optionNames,
      };
    })
    .filter((group): group is CartItemSelection => group !== null);
}

export function calculateMealSelectionPrice(
  meal: Pick<MealDTO, "price" | "variationGroups">,
  selection: MealVariationSelection
) {
  if (meal.variationGroups.length === 0) {
    return meal.price;
  }

  return meal.variationGroups.reduce((total, group) => {
    const optionIds = getNormalizedOptionIds(group, selection);

    return total + group.options
      .filter((option) => optionIds.includes(option.id))
      .reduce((sum, option) => sum + option.price, 0);
  }, 0);
}

export function createCartItemId(
  mealId: string,
  variationGroups: MealVariationGroupDTO[],
  selection: MealVariationSelection
) {
  if (variationGroups.length === 0) {
    return `${mealId}__standard`;
  }

  const token = variationGroups
    .map((group) => {
      const optionIds = getNormalizedOptionIds(group, selection);
      return `${group.id}:${optionIds.sort().join("+") || "none"}`;
    })
    .join("__");

  return `${mealId}__${token}`;
}

export function formatMealVariationSummary(
  source: Pick<CartItem, "selections"> | { selections: CartItemSelection[] }
) {
  if (source.selections.length === 0) {
    return "Standard";
  }

  return source.selections
    .map((group) => `${group.groupName}: ${group.optionNames.join(", ")}`)
    .join(" · ");
}

export function getMealVariationLines(
  source: Pick<CartItem, "selections"> | { selections: CartItemSelection[] }
): string[] {
  if (source.selections.length === 0) {
    return ["Standard"];
  }

  const lines: string[] = [];

  for (const group of source.selections) {
    // Check if this is a drinks/types group with multiple selections
    if (
      (group.groupName.toLowerCase() === "drink" ||
        group.groupName.toLowerCase() === "type") &&
      group.optionNames.length > 1
    ) {
      // For drinks/types with multiple selections, each on its own line with format "DrinkName - 1"
      for (const optionName of group.optionNames) {
        // Remove size info in parentheses (e.g., "Fura (340ml)" -> "Fura")
        const drinkName = optionName.replace(/\s*\([^)]*\)\s*/g, "").trim();
        lines.push(`${drinkName} - 1`);
      }
    } else {
      // For other selections, use the original format
      lines.push(`${group.groupName}: ${group.optionNames.join(", ")}`);
    }
  }

  return lines;
}

export function formatPendingMealVariationSummary(
  meal: Pick<MealDTO, "variationGroups">,
  selection: MealVariationSelection
) {
  return formatMealVariationSummary({
    selections: buildCartSelections(meal, selection),
  });
}

export function formatCartItemName(item: Pick<CartItem, "mealName" | "selections">) {
  const summary = formatMealVariationSummary(item);
  return summary === "Standard" ? item.mealName : `${item.mealName} (${summary})`;
}

// ─── Detect if meal is drinks ─────────────────────────────────────────────

export function isDrinksMeal(meal: Pick<MealDTO, "name" | "variationGroups">): boolean {
  return (
    meal.name.toLowerCase() === "drinks" &&
    meal.variationGroups.length > 0 &&
    meal.variationGroups.some(
      (group) =>
        group.name.toLowerCase() === "drink" ||
        group.name.toLowerCase() === "type"
    )
  );
}

// ─── Get drink group ──────────────────────────────────────────────────────

function getDrinkGroup(
  meal: Pick<MealDTO, "variationGroups">
): MealVariationGroupDTO | undefined {
  return meal.variationGroups.find(
    (group) =>
      group.name.toLowerCase() === "drink" ||
      group.name.toLowerCase() === "type"
  );
}

// ─── Create individual cart items for drinks ──────────────────────────────

/**
 * For drinks meals, creates individual CartItems for each selected drink.
 * This replaces createCustomisedCartItem for drinks.
 */
export function createIndividualDrinkItems(
  meal: MealDTO,
  selection: MealVariationSelection
): CartItem[] {
  const drinkGroup = getDrinkGroup(meal);
  if (!drinkGroup) return [];

  const selectedDrinkIds = selection[drinkGroup.id] || [];
  if (selectedDrinkIds.length === 0) return [];

  // Get other groups (like size) that apply to all drinks
  const otherGroupSelections = meal.variationGroups
    .filter((g) => g.id !== drinkGroup.id)
    .reduce<CartItemSelection[]>((acc, group) => {
      const optionIds = getNormalizedOptionIds(group, selection);
      if (optionIds.length === 0) return acc;

      const optionNames = group.options
        .filter((option) => optionIds.includes(option.id))
        .map((option) => option.name);

      acc.push({
        groupId: group.id,
        groupName: group.name,
        selectionType: group.selectionType,
        optionIds,
        optionNames,
      });
      return acc;
    }, []);

  // Calculate the price modifier from other groups (e.g., size upcharge)
  const otherGroupsPrice = meal.variationGroups
    .filter((g) => g.id !== drinkGroup.id)
    .reduce((total, group) => {
      const optionIds = getNormalizedOptionIds(group, selection);
      return (
        total +
        group.options
          .filter((option) => optionIds.includes(option.id))
          .reduce((sum, option) => sum + option.price, 0)
      );
    }, 0);

  // Create individual CartItems for each selected drink
  return selectedDrinkIds
    .map((drinkOptionId) => {
      const drinkOption = drinkGroup.options.find((o) => o.id === drinkOptionId);
      if (!drinkOption) return null;

      const drinkPrice = drinkOption.price + otherGroupsPrice;

      return {
        cartItemId: `${meal.id}__drink_${drinkOptionId}`,
        mealId: meal.id,
        mealName: drinkOption.name,
        quantity: 1,
        unitPrice: drinkPrice,
        selections: otherGroupSelections,
      };
    })
    .filter((item): item is CartItem => item !== null);
}

// ─── Detect if meal is extra topping ──────────────────────────────────────

export function isToppingsMeal(meal: Pick<MealDTO, "name" | "variationGroups">): boolean {
  return (
    meal.name.toLowerCase() === "extra topping" &&
    meal.variationGroups.length > 0 &&
    meal.variationGroups.some(
      (group) =>
        group.name.toLowerCase() === "type" ||
        group.name.toLowerCase() === "topping"
    )
  );
}

// ─── Get topping group ────────────────────────────────────────────────────

function getToppingGroup(
  meal: Pick<MealDTO, "variationGroups">
): MealVariationGroupDTO | undefined {
  return meal.variationGroups.find(
    (group) =>
      group.name.toLowerCase() === "type" ||
      group.name.toLowerCase() === "topping"
  );
}

// ─── Create individual cart items for toppings ────────────────────────────

/**
 * For topping meals, creates individual CartItems for each selected topping.
 * This replaces createCustomisedCartItem for toppings.
 */
export function createIndividualToppingItems(
  meal: MealDTO,
  selection: MealVariationSelection
): CartItem[] {
  const toppingGroup = getToppingGroup(meal);
  if (!toppingGroup) return [];

  const selectedToppingIds = selection[toppingGroup.id] || [];
  if (selectedToppingIds.length === 0) return [];

  // Get other groups that apply to all toppings
  const otherGroupSelections = meal.variationGroups
    .filter((g) => g.id !== toppingGroup.id)
    .reduce<CartItemSelection[]>((acc, group) => {
      const optionIds = getNormalizedOptionIds(group, selection);
      if (optionIds.length === 0) return acc;

      const optionNames = group.options
        .filter((option) => optionIds.includes(option.id))
        .map((option) => option.name);

      acc.push({
        groupId: group.id,
        groupName: group.name,
        selectionType: group.selectionType,
        optionIds,
        optionNames,
      });
      return acc;
    }, []);

  // Calculate the price modifier from other groups
  const otherGroupsPrice = meal.variationGroups
    .filter((g) => g.id !== toppingGroup.id)
    .reduce((total, group) => {
      const optionIds = getNormalizedOptionIds(group, selection);
      return (
        total +
        group.options
          .filter((option) => optionIds.includes(option.id))
          .reduce((sum, option) => sum + option.price, 0)
      );
    }, 0);

  // Create individual CartItems for each selected topping
  return selectedToppingIds
    .map((toppingOptionId) => {
      const toppingOption = toppingGroup.options.find((o) => o.id === toppingOptionId);
      if (!toppingOption) return null;

      const toppingPrice = toppingOption.price + otherGroupsPrice;

      return {
        cartItemId: `${meal.id}__topping_${toppingOptionId}`,
        mealId: meal.id,
        mealName: toppingOption.name,
        quantity: 1,
        unitPrice: toppingPrice,
        selections: otherGroupSelections,
      };
    })
    .filter((item): item is CartItem => item !== null);
}

export function createCustomisedCartItem(
  meal: MealDTO,
  selection: MealVariationSelection
): CartItem {
  const selections = buildCartSelections(meal, selection);

  return {
    cartItemId: createCartItemId(meal.id, meal.variationGroups, selection),
    mealId: meal.id,
    mealName: meal.name,
    quantity: 1,
    unitPrice: calculateMealSelectionPrice(meal, selection),
    selections,
  };
}