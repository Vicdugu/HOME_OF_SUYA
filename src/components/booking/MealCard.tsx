"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Check, Flame, ShoppingCart, AlertCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { BlurImage } from "@/components/ui/BlurImage";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import {
  calculateMealSelectionPrice,
  createCartItemId,
  createCustomisedCartItem,
  createInitialMealSelection,
  formatPendingMealVariationSummary,
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
  const [focusedGroupId, setFocusedGroupId] = useState<string | null>(null);

  useEffect(() => {
    setSelection(createInitialMealSelection(meal));
    setValidationError(null);
    setFocusedGroupId(null);
  }, [meal]);

  const hasCustomisations = meal.variationGroups.length > 0;

  const mealItems = state.items.filter((i) => i.mealId === meal.id);
  const quantity = mealItems.reduce((sum, item) => sum + item.quantity, 0);
  const selectedCartItemId = createCartItemId(meal.id, meal.variationGroups, selection);
  const selectedCartItem = state.items.find((item) => item.cartItemId === selectedCartItemId);
  const selectedQuantity = selectedCartItem?.quantity ?? 0;
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
    addItem(createCustomisedCartItem(meal, selection));
  };

  const handleDecrease = () => setQuantity(selectedCartItemId, selectedQuantity - 1);
  const handleIncrease = () =>
    selectedQuantity === 0
      ? handleAddSelection()
      : setQuantity(selectedCartItemId, selectedQuantity + 1);

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

        {/* Inline Customization Options - Always Visible */}
        {hasCustomisations && meal.isAvailable && (
          <div className="space-y-3 rounded-xl border border-white bg-surface-dark/60 p-3">
            {meal.variationGroups.map((group, groupIndex) => {
              const isLocked = isGroupLocked(groupIndex);
              const isComplete = getGroupCompletionStatus(group.id);
              const isFocused = focusedGroupId === group.id || (groupIndex === 0 && !focusedGroupId);

              return (
                <div
                  key={group.id}
                  className={`space-y-1.5 rounded-lg border p-2 transition-all ${
                    isLocked
                      ? "opacity-50 bg-surface-border/20 border-white/40"
                      : isFocused
                      ? "bg-surface-border/40 border border-white"
                      : "border-white/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                        {group.name}
                      </p>
                      {isComplete && (
                        <Check size={14} className="text-green-400" />
                      )}
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-gray-600">
                      {group.selectionType === "SINGLE" ? "Choose one" : "Choose any"}
                    </span>
                  </div>

                  {isLocked && (
                    <p className="text-[10px] text-amber-300/70 italic">
                      Complete previous selection to unlock
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => {
                      const selected = (selection[group.id] ?? []).includes(option.id);
                      const isMultiple = group.selectionType === "MULTIPLE";
                      const isSize = group.name === "SIZE";

                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            if (!isLocked) {
                              toggleOption(group.id, option.id, group.selectionType);
                              // Auto-focus next group after selection
                              if (group.selectionType === "SINGLE") {
                                const nextGroup = meal.variationGroups[groupIndex + 1];
                                if (nextGroup) {
                                  setFocusedGroupId(nextGroup.id);
                                }
                              }
                            }
                          }}
                          disabled={isLocked}
                          className={[
                            "rounded-full border px-3 py-1.5 text-xs transition-all",
                            isLocked
                              ? "opacity-50 cursor-not-allowed border-white/30"
                              : selected
                              ? isMultiple && !isSize
                                ? "border-brand-gold bg-brand-gold/20 text-brand-gold"
                                : "border-brand-red bg-brand-red text-white shadow-lg shadow-brand-red/20"
                              : "border-white text-gray-300 hover:border-white hover:text-gray-100",
                          ].join(" ")}
                        >
                          {option.name}
                          {option.price > 0 ? ` (${formatCurrency(option.price)})` : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Selection Summary */}
            <p className="text-xs text-gray-500 pt-1">
              {formatPendingMealVariationSummary(meal, selection)}
            </p>

            {/* Validation Error Message */}
            {validationError && (
              <div className="flex gap-2 items-start text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}
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
