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
    selection[group.id] =
      group.selectionType === "SINGLE" && group.options[0] ? [group.options[0].id] : [];
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