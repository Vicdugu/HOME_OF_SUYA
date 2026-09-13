"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Check, Flame, ShoppingCart } from "lucide-react";
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
  const [customising, setCustomising] = useState(false);
  const [selection, setSelection] = useState<MealVariationSelection>(() =>
    createInitialMealSelection(meal)
  );

  useEffect(() => {
    setSelection(createInitialMealSelection(meal));
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

  const handleOpenCustomization = () => {
    if (!meal.isAvailable || !hasCustomisations) return;
    setCustomising(true);
    onCustomizeStart();
  };

  const isSelectionComplete = () => {
    return meal.variationGroups.every((group) => {
      if (group.selectionType === "SINGLE") {
        return (selection[group.id] ?? []).length > 0;
      }
      return true;
    });
  };

  const handleAddSelection = () => {
    if (!isSelectionComplete()) return;
    addItem(createCustomisedCartItem(meal, selection));
    setCustomising(false);
    onCustomizeEnd();
  };
  const handleDecrease = () => setQuantity(selectedCartItemId, selectedQuantity - 1);
  const handleIncrease = () =>
    selectedQuantity === 0
      ? handleAddSelection()
      : setQuantity(selectedCartItemId, selectedQuantity + 1);

  function toggleOption(groupId: string, optionId: string, selectionType: VariationSelectionType) {
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
      role="button"
      tabIndex={meal.isAvailable && hasCustomisations ? 0 : -1}
      aria-label={meal.isAvailable && hasCustomisations ? `Customize ${meal.name}` : meal.name}
      onClick={(event) => {
        if (event.target instanceof HTMLElement && event.target.closest("button")) return;
        if (!customising && meal.isAvailable && hasCustomisations) {
          handleOpenCustomization();
        }
      }}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && meal.isAvailable && hasCustomisations) {
          event.preventDefault();
          handleOpenCustomization();
        }
      }}
      className={`card flex flex-col overflow-hidden transition-all duration-200 cursor-pointer
        ${!meal.isAvailable ? "opacity-50" : "hover:border-brand-red/40"}`}
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

        {customising && meal.isAvailable && hasCustomisations && (
          <div className="space-y-3 rounded-xl border border-surface-border bg-surface-dark/60 p-3" onClick={(event) => event.stopPropagation()}>
            {meal.variationGroups.map((group) => (
              <div key={group.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                    {group.name}
                  </p>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-gray-600">
                    {group.selectionType === "SINGLE" ? "Choose one" : "Choose any"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const selected = (selection[group.id] ?? []).includes(option.id);
                    const isMultiple = group.selectionType === "MULTIPLE";
                    const isSize = group.name === "SIZE";

                    return (
                      <button
                        key={option.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleOption(group.id, option.id, group.selectionType);
                        }}
                        className={[
                          "rounded-full border px-3 py-1.5 text-xs transition-colors",
                          selected
                            ? isMultiple && !isSize
                              ? "border-brand-gold bg-brand-gold/20 text-brand-gold"
                              : "border-brand-red bg-brand-red text-white"
                            : "border-surface-border text-gray-300 hover:border-brand-red/40",
                        ].join(" ")}
                      >
                        {option.name}
                        {option.price > 0 ? ` (${formatCurrency(option.price)})` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <p className="text-xs text-gray-500">
              {formatPendingMealVariationSummary(meal, selection)}
            </p>
          </div>
        )}

        {/* Price + quantity row */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-surface-border">
          <span className="text-brand-gold font-bold text-lg">
            {formatCurrency(displayedPrice)}
          </span>

          {meal.isAvailable ? (
            hasCustomisations ? (
              !customising ? (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenCustomization();
                  }}
                  aria-label={`Customize ${meal.name}`}
                  className="flex items-center gap-1.5 btn-primary py-1.5 px-3 text-xs sm:py-2 sm:px-4 sm:text-sm"
                >
                  <ShoppingCart size={14} className="sm:size-4" />
                  Customize
                </button>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  {selectedQuantity === 0 ? (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
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
                  )}
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setCustomising(false);
                      onCustomizeEnd();
                    }}
                    className="text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              )
            ) : quantity === 0 ? (
              <button
                onClick={(event) => {
                  event.stopPropagation();
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
