"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Check, Flame, ShoppingCart, AlertCircle, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { BlurImage } from "@/components/ui/BlurImage";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import {
  calculateMealSelectionPrice,
  createCartItemId,
  createCustomisedCartItem,
  createInitialMealSelection,
  formatPendingMealVariationSummary,
  isDrinksMeal,
  createIndividualDrinkItems,
  isToppingsMeal,
  createIndividualToppingItems,
  isMasaMeal,
  createIndividualMasaItems,
} from "@/lib/meal-variations";
import { formatCurrency } from "@/lib/utils";
import type { MealDTO, MealVariationSelection, VariationSelectionType } from "@/types";

interface MealCardProps {
  meal: MealDTO;
  isCustomizing?: boolean;
  onCustomizeStart?: () => void;
  onCustomizeEnd?: () => void;
}

function isLocalMealPhotoUrl(imageUrl: string) {
  return imageUrl.startsWith("/api/meal-photos?");
}

function formatSpiceLevel(spiceLevel: MealDTO["spiceLevel"]) {
  return spiceLevel ? spiceLevel.replace(/_/g, " ").toLowerCase() : null;
}

export function MealCard({
  meal,
  isCustomizing: isCustomizingProp = false,
  onCustomizeStart = () => {},
  onCustomizeEnd = () => {},
}: MealCardProps) {
  const { state, addItem, setQuantity } = useCart();
  const [selection, setSelection] = useState<MealVariationSelection>(() =>
    createInitialMealSelection(meal)
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [expandedGroupIndex, setExpandedGroupIndex] = useState<number>(0); // 0 = Step 1 expanded by default

  useEffect(() => {
    setSelection(createInitialMealSelection(meal));
    setValidationError(null);
    setExpandedGroupIndex(0); // Reset to Step 1 on meal change
  }, [meal]);

  // Auto-expand next group when current group selection is completed
  useEffect(() => {
    if (!meal.variationGroups.length) return;
    
    const currentGroup = meal.variationGroups[expandedGroupIndex];
    if (!currentGroup) return;
    
    // Check if current group is complete (has at least one selection)
    const isCurrentGroupComplete = (selection[currentGroup.id] ?? []).length > 0;
    
    // If current group is now complete, expand next group
    if (isCurrentGroupComplete) {
      const nextIndex = expandedGroupIndex + 1;
      if (nextIndex < meal.variationGroups.length) {
        const timeoutId = setTimeout(() => {
          setExpandedGroupIndex(nextIndex);
        }, 50);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [selection, expandedGroupIndex, meal.variationGroups.length, meal.id]);

  const hasCustomisations = meal.variationGroups.length > 0;
  const isMultiItemMeal = isDrinksMeal(meal) || isToppingsMeal(meal) || isMasaMeal(meal);

  const mealItems = state.items.filter((i) => i.mealId === meal.id);
  const quantity = mealItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // For multi-item meals (drinks/toppings), quantity is sum of all items; for other meals, track single CartItemId
  let selectedQuantity = 0;
  let selectedCartItemId = "";
  let selectedCartItem = undefined;
  
  if (isMultiItemMeal) {
    // For multi-item meals, selectedQuantity is the total of all items currently in cart
    selectedQuantity = quantity;
  } else {
    selectedCartItemId = createCartItemId(meal.id, meal.variationGroups, selection);
    selectedCartItem = state.items.find((item) => item.cartItemId === selectedCartItemId);
    selectedQuantity = selectedCartItem?.quantity ?? 0;
  }

  const displayedPrice = hasCustomisations
    ? calculateMealSelectionPrice(meal, selection)
    : meal.price;
  const isSoldOut = meal.stockStatus === "SOLD_OUT";
  const stockLabel = isSoldOut
    ? "Sold Out"
    : meal.stockStatus === "LOW_STOCK"
    ? "Low Stock"
    : meal.isAvailable
    ? "In Stock"
    : "Unavailable";
  const spiceLabel = formatSpiceLevel(meal.spiceLevel);

  // Check which groups are complete
  const getGroupCompletionStatus = (groupId: string): boolean => {
    const group = meal.variationGroups.find((g) => g.id === groupId);
    if (!group) return false;
    if (group.selectionType === "SINGLE") {
      return (selection[groupId] ?? []).length > 0;
    }
    return true; // MULTIPLE is always "complete" (optional)
  };

  // Check if all required groups are complete
  const isSelectionComplete = (): boolean => {
    return meal.variationGroups.every((group) => {
      if (group.selectionType === "SINGLE") {
        return (selection[group.id] ?? []).length > 0;
      }
      return true;
    });
  };

  // Get the first incomplete SINGLE selection group
  const getFirstIncompleteGroup = (): string | null => {
    for (const group of meal.variationGroups) {
      if (group.selectionType === "SINGLE" && (selection[group.id] ?? []).length === 0) {
        return group.name;
      }
    }
    return null;
  };

  // Determine if a group should be locked based on sequential order
  const isGroupLocked = (groupIndex: number): boolean => {
    // A group is locked if any previous required group is incomplete
    for (let i = 0; i < groupIndex; i++) {
      const prevGroup = meal.variationGroups[i];
      if (prevGroup.selectionType === "SINGLE") {
        if (!getGroupCompletionStatus(prevGroup.id)) {
          return true;
        }
      }
    }
    return false;
  };

  const handleAddSelection = () => {
    if (!isSelectionComplete()) {
      const missingGroup = getFirstIncompleteGroup();
      setValidationError(missingGroup ? `Please select a ${missingGroup} to complete your order` : "Please complete all required selections");
      return;
    }
    setValidationError(null);
    
    // For multi-item meals (drinks/toppings/masa), add each item as an individual cart item
    if (isDrinksMeal(meal)) {
      const drinkItems = createIndividualDrinkItems(meal, selection);
      drinkItems.forEach((item) => addItem(item));
    } else if (isToppingsMeal(meal)) {
      const toppingItems = createIndividualToppingItems(meal, selection);
      toppingItems.forEach((item) => addItem(item));
    } else if (isMasaMeal(meal)) {
      const masaItems = createIndividualMasaItems(meal, selection);
      masaItems.forEach((item) => addItem(item));
    } else {
      addItem(createCustomisedCartItem(meal, selection));
    }
    
    // Clear selections after adding to cart
    setSelection(createInitialMealSelection(meal));
    setValidationError(null);
    setExpandedGroupIndex(0);
  };

  const handleDecrease = () => {
    if (isMultiItemMeal) {
      // For multi-item meals with items in cart, don't allow decrease from MealCard
      // Users should manage individual item quantities from CartDrawer
      // This prevents ambiguity about which item to decrease
      return;
    } else {
      setQuantity(selectedCartItemId, selectedQuantity - 1);
    }
  };

  const handleIncrease = () => {
    if (selectedQuantity === 0) {
      handleAddSelection();
    } else if (isMultiItemMeal) {
      // For multi-item meals, clicking + re-opens selection to add more items
      handleAddSelection();
    } else {
      setQuantity(selectedCartItemId, selectedQuantity + 1);
    }
  };

  function toggleOption(groupId: string, optionId: string, selectionType: VariationSelectionType) {
    setValidationError(null); // Clear error when user makes a selection
    setSelection((current) => ({
      ...current,
      [groupId]:
        selectionType === "SINGLE"
          ? [optionId]
          : current[groupId]?.includes(optionId)
          ? current[groupId].filter((item) => item !== optionId)
          : [...(current[groupId] ?? []), optionId],
    }));
  }

  return (
    <article
      role="article"
      className={`card flex flex-col overflow-hidden transition-all duration-200
        ${!meal.isAvailable ? "opacity-50" : ""}`}
    >
      {/* Meal image */}
      <div className="relative w-full aspect-[4/3] bg-surface-dark overflow-hidden">
        <BlurImage
          src={meal.imageUrl}
          alt={meal.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized={isLocalMealPhotoUrl(meal.imageUrl)}
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-card/80 to-transparent" />

        {/* Sold out badge */}
        {!meal.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              {isSoldOut ? "Sold Out" : "Unavailable"}
            </span>
          </div>
        )}

        {/* In-cart indicator */}
        {quantity > 0 && (
          <div className="absolute top-2 right-2 bg-brand-red text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
            {quantity}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-base leading-snug">
            {meal.name}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em]">
            <span className={`rounded-full border px-2 py-1 ${meal.stockStatus === "LOW_STOCK" ? "border-amber-500/40 text-amber-300" : meal.stockStatus === "SOLD_OUT" ? "border-brand-red/40 text-brand-red" : "border-green-500/30 text-green-300"}`}>
              {stockLabel}
            </span>
            {spiceLabel ? (
              <span className="rounded-full border border-brand-gold/30 px-2 py-1 text-brand-gold inline-flex items-center gap-1">
                <Flame size={10} />
                {spiceLabel}
              </span>
            ) : null}
          </div>
          <p className="text-gray-400 text-sm mt-1 line-clamp-2 leading-relaxed">
            {meal.description}
          </p>
          {meal.allergenInfo ? (
            <p className="mt-2 text-[11px] text-amber-200/85 inline-flex items-start gap-1.5">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>Allergens: {meal.allergenInfo}</span>
            </p>
          ) : null}
        </div>

        {/* Customization Section - 3-Step Sequential Flow */}
        {hasCustomisations && meal.isAvailable && (
          <div className="space-y-4 rounded-xl border border-brand-gold/30 bg-surface-dark/60 p-4">
            {/* Progress indicator */}
            <div className="flex gap-2 items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-gold">
                Customize Your Order
              </p>
              <div className="flex gap-1.5">
                {meal.variationGroups.map((group, idx) => {
                  const isComplete = getGroupCompletionStatus(group.id);
                  const isRequired = group.selectionType === "SINGLE";
                  return (
                    <div
                      key={group.id}
                      className={`w-2 h-2 rounded-full transition-all ${
                        isComplete
                          ? "bg-green-400"
                          : isRequired
                          ? "bg-brand-red/50"
                          : "bg-gray-600"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Steps */}
            {meal.variationGroups.map((group, groupIndex) => {
              const isLocked = isGroupLocked(groupIndex);
              const isComplete = getGroupCompletionStatus(group.id);
              const isRequired = group.selectionType === "SINGLE";
              const stepNumber = groupIndex + 1;
              const hasSingleStep = meal.variationGroups.length === 1;
              
              // Only the step matching expandedGroupIndex shows its content
              const isExpanded = groupIndex === expandedGroupIndex;
              const shouldShowContent = isExpanded && !isLocked;

              // For single-step items, always show content without accordion header
              if (hasSingleStep) {
                return (
                  <div key={group.id} className="border-t-2 border-white/60 pt-3.5 mt-4">
                    {/* Selection Type Hint */}
                    <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                      {group.selectionType === "SINGLE"
                        ? "Choose one option"
                        : "Choose any options"}
                    </p>

                    {/* Options Grid */}
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => {
                        const selected = (selection[group.id] ?? []).includes(option.id);
                        const isMultiple = group.selectionType === "MULTIPLE";

                        return (
                          <button
                            key={option.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isLocked) {
                                toggleOption(group.id, option.id, group.selectionType);
                              }
                            }}
                            disabled={isLocked}
                            className={[
                              "rounded-full border px-3 py-2 text-xs font-medium transition-all whitespace-nowrap",
                              isLocked
                                ? "opacity-30 cursor-not-allowed border-white/20 text-gray-600"
                                : selected
                                ? isMultiple
                                  ? "border-brand-gold bg-brand-gold/20 text-brand-gold shadow-sm shadow-brand-gold/20"
                                  : "border-brand-red bg-brand-red text-white shadow-lg shadow-brand-red/30"
                                : "border-white/60 text-gray-300 hover:border-white hover:text-white hover:bg-white/5",
                            ].join(" ")}
                          >
                            {option.name}
                            {option.price > 0 ? (
                              <span className="text-[10px] opacity-80">
                                {" "}
                                +{formatCurrency(option.price)}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // Multi-step accordion version
              return (
                <div key={group.id} className="overflow-hidden border-t-2 border-white/60 pt-3.5 mt-4">
                  {/* Accordion Header - Clickable to toggle expand/collapse */}
                  <button
                    onClick={() => {
                      if (!isLocked) {
                        // Toggle: if already expanded, collapse; otherwise expand
                        setExpandedGroupIndex(expandedGroupIndex === groupIndex ? -1 : groupIndex);
                      }
                    }}
                    disabled={isLocked}
                    className={`w-full text-left space-y-2.5 p-0 transition-all duration-300 ${
                      isLocked
                        ? "opacity-50 cursor-not-allowed"
                        : isExpanded
                        ? ""
                        : isComplete
                        ? ""
                        : ""
                    }`}
                  >
                    {/* Step Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div
                          className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs shrink-0 transition-all ${
                            isComplete
                              ? "bg-green-500 text-white"
                              : isLocked
                              ? "bg-white/20 text-gray-500"
                              : isExpanded
                              ? "bg-brand-red text-white"
                              : isRequired
                              ? "bg-brand-red/60 text-white"
                              : "bg-gray-600 text-white"
                          }`}
                        >
                          {isComplete ? <Check size={14} /> : stepNumber}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-white leading-tight">
                            Step {stepNumber}: {group.name}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {isRequired ? "Required" : "Optional"}
                          </p>
                        </div>
                      </div>
                      {isComplete && !isLocked && (
                        <Check size={16} className="text-green-400 shrink-0 mt-0.5" />
                      )}
                    </div>

                    {/* Lock Message - Show if locked */}
                    {isLocked && (
                      <p className="text-[10px] text-amber-300/70 italic pl-8">
                        Complete Step {groupIndex} to unlock
                      </p>
                    )}
                  </button>

                  {/* Expandable Content - Smooth collapse/expand animation */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      shouldShowContent ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <div className="space-y-2.5 pt-3.5">
                      {/* Selection Type Hint */}
                      <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500 pl-8">
                        {groupIndex === 0
                          ? "Choose size"
                          : groupIndex === 1
                          ? "Choose Topping"
                          : groupIndex === 2
                          ? "Add Veggies"
                          : group.selectionType === "SINGLE"
                          ? "Choose one option"
                          : "Choose any options"}
                      </p>

                      {/* Options Grid */}
                      <div className="flex flex-wrap gap-2 pl-8">
                        {group.options.map((option) => {
                          const selected = (selection[group.id] ?? []).includes(option.id);
                          const isMultiple = group.selectionType === "MULTIPLE";

                          return (
                            <button
                              key={option.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isLocked) {
                                  toggleOption(group.id, option.id, group.selectionType);
                                }
                              }}
                              disabled={isLocked}
                              className={[
                                "rounded-full border px-3 py-2 text-xs font-medium transition-all whitespace-nowrap",
                                isLocked
                                  ? "opacity-30 cursor-not-allowed border-white/20 text-gray-600"
                                  : selected
                                  ? isMultiple
                                    ? "border-brand-gold bg-brand-gold/20 text-brand-gold shadow-sm shadow-brand-gold/20"
                                    : "border-brand-red bg-brand-red text-white shadow-lg shadow-brand-red/30"
                                  : "border-white/60 text-gray-300 hover:border-white hover:text-white hover:bg-white/5",
                              ].join(" ")}
                            >
                              {option.name}
                              {option.price > 0 ? (
                                <span className="text-[10px] opacity-80">
                                  {" "}
                                  +{formatCurrency(option.price)}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Selection Summary & Error */}
            <div className="space-y-2 border-t border-white/20 pt-3">
              <p className="text-xs text-gray-400">
                Selected:{" "}
                <span className="text-white font-medium">
                  {formatPendingMealVariationSummary(meal, selection) || "None"}
                </span>
              </p>

              {validationError && (
                <div className="flex gap-2 items-start text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price + quantity row */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white">
          <span className="text-brand-gold font-bold text-lg">
            {formatCurrency(displayedPrice)}
          </span>

          {meal.isAvailable ? (
            hasCustomisations ? (
              selectedQuantity === 0 ? (
                <button
                  onClick={() => {
                    handleAddSelection();
                  }}
                  disabled={!isSelectionComplete()}
                  aria-label={`Add ${meal.name} with selected options to cart`}
                  className="flex items-center gap-1.5 btn-primary py-1.5 px-3 text-xs sm:py-2 sm:px-4 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={14} className="sm:size-4" />
                  Add to Order
                </button>
              ) : isMultiItemMeal ? (
                // For multi-item meals already in cart, only show "Add More" button
                <button
                  onClick={handleIncrease}
                  aria-label={`Add more ${meal.name} to cart`}
                  className="flex items-center gap-1.5 btn-primary py-1.5 px-3 text-xs sm:py-2 sm:px-4 sm:text-sm"
                >
                  <Plus size={14} className="sm:size-4" />
                  Add More
                </button>
              ) : (
                <QuantitySelector
                  quantity={selectedQuantity}
                  onDecrease={handleDecrease}
                  onIncrease={handleIncrease}
                />
              )
            ) : quantity === 0 ? (
              <button
                onClick={() => {
                  handleAddSelection();
                }}
                aria-label={`Add ${meal.name} to cart`}
                className="flex items-center gap-1.5 btn-primary py-1.5 px-3 text-xs sm:py-2 sm:px-4 sm:text-sm"
              >
                <ShoppingCart size={14} className="sm:size-4" />
                Add
              </button>
            ) : (
              <QuantitySelector
                quantity={selectedQuantity}
                onDecrease={handleDecrease}
                onIncrease={handleIncrease}
              />
            )
          ) : null}
        </div>
      </div>
    </article>
  );
}
