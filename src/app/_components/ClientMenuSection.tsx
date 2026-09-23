"use client";

import { useState } from "react";
import { ShoppingBag, Flame } from "lucide-react";
import { MealCard } from "@/components/booking/MealCard";
import { CartDrawer } from "@/components/booking/CartDrawer";
import { FloatingCartButton } from "@/components/booking/FloatingCartButton";
import { useCart } from "@/context/CartContext";
import type { MealDTO } from "@/types";

interface ClientMenuSectionProps {
  meals: MealDTO[];
}

export function ClientMenuSection({ meals }: ClientMenuSectionProps) {
  const [customizingMealId, setCustomizingMealId] = useState<string | null>(null);
  const { totalItems, cartOpen, setCartOpen } = useCart();

  const handleCustomizeStart = (mealId: string) => {
    setCustomizingMealId(mealId);
    const menuSection = document.getElementById("menu");
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCustomizeEnd = () => {
    setCustomizingMealId(null);
  };

  const availableMeals = meals.filter((m) => m.isAvailable);
  const unavailableMeals = meals.filter((m) => !m.isAvailable);

  return (
    <>
      {/* Mobile cart button */}
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        aria-label={`Open cart with ${totalItems} item${totalItems === 1 ? "" : "s"}`}
        className="fixed left-4 top-4 z-40 flex items-center justify-center rounded-full border border-brand-gold/40 bg-brand-black/80 p-2.5 text-brand-gold shadow-lg shadow-black/30 backdrop-blur-sm transition hover:bg-brand-black sm:hidden"
      >
        <ShoppingBag size={18} />
        {totalItems > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-black text-white">
            {totalItems > 9 ? "9+" : totalItems}
          </span>
        )}
      </button>

      {/* ── Menu ─────────────────────────────────────────────────── */}
      <section id="menu" className="max-w-5xl mx-auto px-4 py-6 pb-28 scroll-mt-24 sm:py-8">
        <h2 className="text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6">
          Our Menu
          <span className="ml-2 text-gray-500 text-sm font-normal">
            ({availableMeals.length} available)
          </span>
        </h2>

        {meals.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Flame size={40} className="mx-auto mb-4 opacity-30" />
            <p>Menu coming soon. Check back later!</p>
          </div>
        ) : (
          <>
            {/* On mobile with customizing meal, show only that meal in full width */}
            {customizingMealId ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                  {availableMeals
                    .filter((meal) => meal.id === customizingMealId)
                    .map((meal) => (
                      <MealCard
                        key={meal.id}
                        meal={meal}
                        isCustomizing={true}
                        onCustomizeStart={() => handleCustomizeStart(meal.id)}
                        onCustomizeEnd={handleCustomizeEnd}
                      />
                    ))}
                </div>
                {/* Show other meals on desktop only */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                  {availableMeals
                    .filter((meal) => meal.id !== customizingMealId)
                    .map((meal) => (
                      <MealCard
                        key={meal.id}
                        meal={meal}
                        isCustomizing={false}
                        onCustomizeStart={() => handleCustomizeStart(meal.id)}
                        onCustomizeEnd={handleCustomizeEnd}
                      />
                    ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {availableMeals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    isCustomizing={false}
                    onCustomizeStart={() => handleCustomizeStart(meal.id)}
                    onCustomizeEnd={handleCustomizeEnd}
                  />
                ))}
              </div>
            )}

            {unavailableMeals.length > 0 && (
              <div className="mt-6 sm:mt-10">
                <h3 className="text-gray-500 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3 sm:mb-4">
                  Currently Unavailable
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                  {unavailableMeals.map((meal) => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      isCustomizing={false}
                      onCustomizeStart={() => {}}
                      onCustomizeEnd={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Cart ─────────────────────────────────────────────────── */}
      <FloatingCartButton onClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
