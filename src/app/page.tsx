"use client";

import { useState, useEffect } from "react";
import { Flame, MapPin, Clock } from "lucide-react";
import { MealCard } from "@/components/booking/MealCard";
import { CartDrawer } from "@/components/booking/CartDrawer";
import { FloatingCartButton } from "@/components/booking/FloatingCartButton";
import { HeaderLogo } from "@/components/ui/HeaderLogo";
import type { MealDTO } from "@/types";

export default function MenuPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [meals, setMeals] = useState<MealDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meals")
      .then((r) => r.json())
      .then((data) => { setMeals(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const availableMeals = meals.filter((m) => m.isAvailable);
  const unavailableMeals = meals.filter((m) => !m.isAvailable);

  return (
    <main className="min-h-screen bg-brand-black">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-brand-gradient">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, #D4AF37 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #C41E3A 0%, transparent 50%)`,
          }}
        />

        <div className="absolute left-4 top-4 z-10 md:left-8 md:top-6">
          <HeaderLogo size="customer" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-20 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flame size={28} className="text-brand-gold" />
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Home of Suya
            </h1>
            <Flame size={28} className="text-brand-gold" />
          </div>

          <p className="text-brand-gold font-medium text-sm md:text-base tracking-widest uppercase mb-6">
            Authentic Nigerian BBQ — Cardiff &amp; UK Postage
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <span className="flex items-center gap-1.5 bg-white/10 text-white text-xs px-3 py-1.5 rounded-full border border-white/20">
              <Clock size={12} className="text-brand-gold" />
              Tuesdays &amp; Fridays only
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 text-white text-xs px-3 py-1.5 rounded-full border border-white/20">
              <MapPin size={12} className="text-brand-gold" />
              Pickup · Cardiff Delivery · UK Postage
            </span>
          </div>

          <div className="mt-8 h-px bg-gold-gradient max-w-xs mx-auto opacity-60" />
        </div>
      </header>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="bg-surface-dark border-b border-surface-border">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <ol className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-4 sm:gap-8 text-sm text-gray-400">
            {[
              { step: "1", label: "Pick your meals below" },
              { step: "2", label: "Choose date & delivery" },
              { step: "3", label: "Enter your details" },
              { step: "4", label: "Pay & get confirmed" },
            ].map(({ step, label }) => (
              <li key={step} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {step}
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Menu ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-10 pb-28">
        <h2 className="text-white font-bold text-xl mb-6">
          Our Menu
          <span className="ml-2 text-gray-500 text-sm font-normal">
            ({availableMeals.length} available)
          </span>
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableMeals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>

            {unavailableMeals.length > 0 && (
              <div className="mt-10">
                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-widest mb-4">
                  Currently Unavailable
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unavailableMeals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} />
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
