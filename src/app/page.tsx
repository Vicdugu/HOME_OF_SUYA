"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Flame, MapPin, Clock, PartyPopper, ShoppingBag } from "lucide-react";
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

        <div className="relative mx-auto max-w-[68rem] px-4 pb-5 pt-12 md:px-6 md:pb-6 md:pt-16 lg:px-8 lg:pt-18">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-black/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-brand-gold backdrop-blur-sm">
              <Flame size={12} className="text-brand-gold" />
              Fresh off the grill
            </div>

            <div className="mt-3 space-y-1.5">
              <h1 className="text-[2.35rem] font-black leading-none tracking-[-0.04em] text-white md:text-[3.2rem] xl:text-[4rem]">
                Home of Suya,
              </h1>
              <h2 className="bg-gold-gradient bg-clip-text text-[1.2rem] font-bold leading-tight tracking-[-0.02em] text-transparent md:text-[1.6rem] xl:text-[1.9rem]">
                layered with fire, spice and crunch
              </h2>
            </div>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/78 md:text-sm">
              Nigerian barbecue built around smoky meat, pepper heat, and the fresh bite of tomatoes, onions, and sliced cabbage.
            </p>

            <div className="mt-4 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row lg:justify-start">
              <Link
                href="#menu"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-red px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-brand-red/25 transition-transform transition-colors hover:-translate-y-0.5 hover:bg-brand-red-light"
              >
                <ShoppingBag size={16} />
                Order Now
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/70 bg-[#f8f1e4] px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-[#111111] shadow-lg shadow-black/20 transition-transform transition-colors hover:-translate-y-0.5 hover:bg-white"
              >
                <PartyPopper size={16} />
                Catering / Contact Us
              </Link>
            </div>

            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                <Clock size={12} className="text-brand-gold" />
                Tuesdays &amp; Thursdays only
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                <MapPin size={12} className="text-brand-gold" />
                Pickup · Cardiff Delivery · UK Postage
              </span>
            </div>

          </div>

        </div>
      </header>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="bg-surface-dark/80 border-b border-surface-border">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <ol className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-3 sm:gap-5 text-xs text-gray-400">
            {[
              { step: "1", label: "Pick your meals below" },
              { step: "2", label: "Choose date & delivery" },
              { step: "3", label: "Enter your details" },
              { step: "4", label: "Pay & get confirmed" },
            ].map(({ step, label }) => (
              <li key={step} className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {step}
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Menu ─────────────────────────────────────────────────── */}
      <section id="menu" className="max-w-5xl mx-auto px-4 py-8 pb-28 scroll-mt-24">
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
