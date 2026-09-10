"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Flame, MapPin, Clock, PartyPopper, ShoppingBag } from "lucide-react";
import { MealCard } from "@/components/booking/MealCard";
import { CartDrawer } from "@/components/booking/CartDrawer";
import { FloatingCartButton } from "@/components/booking/FloatingCartButton";
import { HeaderLogo } from "@/components/ui/HeaderLogo";
import { useCart } from "@/context/CartContext";
import type { MealDTO } from "@/types";

export default function MenuPage() {
  const [meals, setMeals] = useState<MealDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [customizingMealId, setCustomizingMealId] = useState<string | null>(null);
  const { totalItems, cartOpen, setCartOpen } = useCart();

  useEffect(() => {
    fetch("/api/meals")
      .then((r) => r.json())
      .then((data) => { setMeals(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const availableMeals = meals.filter((m) => m.isAvailable);
  const unavailableMeals = meals.filter((m) => !m.isAvailable);

  return (
    <main className="min-h-screen bg-brand-black pt-16 sm:pt-0">
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

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <header className="relative isolate overflow-hidden border-b border-brand-gold/15 bg-brand-gradient">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage: `radial-gradient(circle at 18% 22%, rgba(255,208,96,0.34) 0%, transparent 30%),
                              radial-gradient(circle at 82% 18%, rgba(196,30,58,0.28) 0%, transparent 34%),
                              radial-gradient(circle at 50% 120%, rgba(255,255,255,0.08) 0%, transparent 42%)`,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-black via-brand-black/70 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.06)_38%,transparent_55%)] opacity-30" />

        <div className="absolute left-4 top-4 z-10 md:left-6 md:top-4">
          <HeaderLogo size="customer" />
        </div>

        <div className="relative mx-auto max-w-[68rem] px-4 pb-3 pt-8 md:px-6 md:pb-6 md:pt-16 lg:px-8 lg:pt-18">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-black/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-brand-gold backdrop-blur-sm">
              <Flame size={12} className="text-brand-gold" />
              Fresh off the grill
            </div>

            <div className="mt-2 space-y-1">
              <h1 className="text-[1.75rem] font-black leading-none tracking-[-0.04em] text-white md:text-[3.2rem] xl:text-[4rem]">
                Home of Suya,
              </h1>
              <h2 className="bg-gold-gradient bg-clip-text text-[0.9rem] font-bold leading-tight tracking-[-0.02em] text-transparent md:text-[1.6rem] xl:text-[1.9rem]">
                layered with fire, spice and crunch
              </h2>
            </div>

            <p className="mt-2 hidden text-sm leading-6 text-white/78 md:block md:max-w-2xl md:text-sm md:mx-auto">
              Nigerian barbecue built around smoky meat, pepper heat, and the fresh bite of tomatoes, onions, and sliced cabbage.
            </p>

            <div className="mt-3 flex flex-col items-stretch justify-center gap-2 sm:gap-2.5">
              <Link
                href="#menu"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-red px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-brand-red/25 transition-transform transition-colors hover:-translate-y-0.5 hover:bg-brand-red-light sm:px-6 sm:py-3 sm:text-sm"
              >
                <ShoppingBag size={16} />
                Order Now
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/70 bg-[#f8f1e4] px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-[#111111] shadow-lg shadow-black/20 transition-transform transition-colors hover:-translate-y-0.5 hover:bg-white sm:px-6 sm:py-3 sm:text-sm"
              >
                <PartyPopper size={16} />
                Catering / Contact Us
              </Link>
            </div>

            {/* Desktop: 2 badges side-by-side */}
            <div className="mt-3 hidden sm:flex sm:flex-row sm:items-center sm:justify-center sm:gap-3">
              <span className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] text-white backdrop-blur-sm sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
                <Clock size={12} className="text-brand-gold shrink-0" />
                <span>Monday to Saturday</span>
              </span>
              <span className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] text-white backdrop-blur-sm sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
                <MapPin size={12} className="text-brand-gold shrink-0" />
                <span>Pickup · Cardiff Delivery · UK Postage</span>
              </span>
            </div>

            {/* Mobile: Time badge + delivery options in single line */}
            <div className="mt-3 flex flex-col gap-1.5 sm:hidden">
              <span className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
                <Clock size={12} className="text-brand-gold shrink-0" />
                <span>Mon-Sat</span>
              </span>
              <span className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
                <MapPin size={12} className="text-brand-gold shrink-0" />
                <span className="line-clamp-1">UK Postage · Cardiff Delivery · Pickup</span>
              </span>
            </div>

          </div>

        </div>
      </header>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="bg-surface-dark/80 border-b border-surface-border">
        <div className="max-w-5xl mx-auto px-4 py-2">
          <ol className="flex flex-row items-center justify-center gap-2 sm:gap-5 text-xs text-gray-400 overflow-x-auto sm:overflow-visible">
            {[
              { step: "1", label: "Pick your meals below" },
              { step: "2", label: "Choose date & delivery" },
              { step: "3", label: "Enter your details" },
              { step: "4", label: "Pay & get confirmed" },
            ].map(({ step, label }) => (
              <li key={step} className="flex items-center gap-1 sm:gap-2 shrink-0 sm:shrink">
                <span className="h-5 w-5 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {step}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Menu ─────────────────────────────────────────────────── */}
      <section id="menu" className="max-w-5xl mx-auto px-4 py-6 pb-28 scroll-mt-24 sm:py-8">
        <h2 className="text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6">
          Our Menu
          <span className="ml-2 text-gray-500 text-sm font-normal">
            ({availableMeals.length} available)
          </span>
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-72 animate-pulse bg-surface-card" />
            ))}
          </div>
        ) : meals.length === 0 ? (
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
                        onCustomizeStart={() => setCustomizingMealId(meal.id)}
                        onCustomizeEnd={() => setCustomizingMealId(null)}
                      />
                    ))}
                </div>
                {/* Show other meals on desktop only */}
                <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                  {availableMeals
                    .filter((meal) => meal.id !== customizingMealId)
                    .map((meal) => (
                      <MealCard
                        key={meal.id}
                        meal={meal}
                        isCustomizing={false}
                        onCustomizeStart={() => setCustomizingMealId(meal.id)}
                        onCustomizeEnd={() => setCustomizingMealId(null)}
                      />
                    ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {availableMeals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    isCustomizing={false}
                    onCustomizeStart={() => setCustomizingMealId(meal.id)}
                    onCustomizeEnd={() => setCustomizingMealId(null)}
                  />
                ))}
              </div>
            )}

            {unavailableMeals.length > 0 && (
              <div className="mt-6 sm:mt-10">
                <h3 className="text-gray-500 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3 sm:mb-4">
                  Currently Unavailable
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
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
    </main>
  );
}
