"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { formatCurrency } from "@/lib/utils";
import type { MealDTO } from "@/types";

interface MealCardProps {
  meal: MealDTO;
}

export function MealCard({ meal }: MealCardProps) {
  const { state, addItem, setQuantity } = useCart();

  const cartItem = state.items.find((i) => i.mealId === meal.id);
  const quantity = cartItem?.quantity ?? 0;

  const handleDecrease = () => setQuantity(meal.id, quantity - 1);
  const handleIncrease = () =>
    quantity === 0 ? addItem(meal) : setQuantity(meal.id, quantity + 1);

  return (
    <article
      className={`card flex flex-col overflow-hidden transition-all duration-200
        ${!meal.isAvailable ? "opacity-50" : "hover:border-brand-red/40"}`}
    >
      {/* Meal image */}
      <div className="relative w-full aspect-[4/3] bg-surface-dark overflow-hidden">
        <Image
          src={meal.imageUrl}
          alt={meal.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // Fallback to gradient placeholder if image fails
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-card/80 to-transparent" />

        {/* Sold out badge */}
        {!meal.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Unavailable
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
          <p className="text-gray-400 text-sm mt-1 line-clamp-2 leading-relaxed">
            {meal.description}
          </p>
        </div>

        {/* Price + quantity row */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-surface-border">
          <span className="text-brand-gold font-bold text-lg">
            {formatCurrency(meal.price)}
          </span>

          {meal.isAvailable ? (
            quantity === 0 ? (
              <button
                onClick={() => addItem(meal)}
                aria-label={`Add ${meal.name} to cart`}
                className="flex items-center gap-2 btn-primary py-2 px-4 text-sm"
              >
                <ShoppingCart size={15} />
                Add
              </button>
            ) : (
              <QuantitySelector
                quantity={quantity}
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
