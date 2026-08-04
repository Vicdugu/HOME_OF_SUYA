"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Flame, MapPin, Clock, PartyPopper, ShoppingBag } from "lucide-react";
import { MealCard } from "@/components/booking/MealCard";
import { CartDrawer } from "@/components/booking/CartDrawer";
import { FloatingCartButton } from "@/components/booking/FloatingCartButton";
import { HeaderLogo } from "@/components/ui/HeaderLogo";
import type { MealDTO } from "@/types";

function SpiceCup({ className, tone }: { className: string; tone: "gold" | "red" | "green" }) {
  const powderTone =
    tone === "gold"
      ? "from-brand-gold via-[#f2d983] to-[#9d6f1d]"
      : tone === "green"
      ? "from-[#9bd15a] via-[#6c9a32] to-[#3f5f18]"
      : "from-[#ff8a5b] via-brand-red to-[#7f101f]";

  return (
    <div className={`absolute ${className}`} aria-hidden="true">
      <div className="relative h-16 w-16 drop-shadow-[0_14px_24px_rgba(0,0,0,0.35)]">
        <div className={`absolute left-2 right-2 top-1 h-5 rounded-full bg-gradient-to-b ${powderTone}`} />
        <div className="absolute inset-x-1 top-3 h-10 rounded-b-[1.35rem] rounded-t-[0.9rem] border border-white/20 bg-gradient-to-b from-white/30 via-[#f3ece0]/25 to-[#b08968]/60 backdrop-blur-sm" />
        <div className="absolute inset-x-0 top-2 h-4 rounded-full border border-white/25 bg-[#f8e9d1]/70" />
        <div className="absolute bottom-0 left-3 right-3 h-2 rounded-full bg-black/25 blur-sm" />
      </div>
    </div>
  );
}

function VegCluster({ className, variant }: { className: string; variant: "tomato" | "cucumber" | "onion" | "cabbage" }) {
  if (variant === "tomato") {
    return (
      <div className={`absolute ${className}`} aria-hidden="true">
        <div className="relative h-24 w-24 drop-shadow-[0_16px_28px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#ff8a78] via-[#e2423c] to-[#8b1017]" />
          <div className="absolute inset-[14%] rounded-full border border-white/20 bg-gradient-to-br from-white/20 to-transparent" />
          <div className="absolute left-1/2 top-1 h-6 w-6 -translate-x-1/2 rounded-full bg-[#3f6c23] [clip-path:polygon(50%_0%,65%_35%,100%_50%,65%_65%,50%_100%,35%_65%,0%_50%,35%_35%)]" />
          <div className="absolute left-1/2 top-5 h-2 w-2 -translate-x-1/2 rounded-full bg-[#6ca940]" />
        </div>
      </div>
    );
  }

  if (variant === "cucumber") {
    return (
      <div className={`absolute ${className}`} aria-hidden="true">
        <div className="relative h-24 w-24 rotate-[-12deg] drop-shadow-[0_16px_28px_rgba(0,0,0,0.28)]">
          <div className="absolute left-3 top-6 h-12 w-12 rounded-full border-[10px] border-[#4b7f2c] bg-[#d8f0b3]" />
          <div className="absolute left-[1.15rem] top-[1.8rem] h-[2.5rem] w-[2.5rem] rounded-full border border-[#9bcf77]/60" />
          <div className="absolute right-1 top-1 h-12 w-12 rounded-full border-[10px] border-[#5a9434] bg-[#dff5b8]" />
          <div className="absolute right-[0.4rem] top-[0.4rem] h-[2.5rem] w-[2.5rem] rounded-full border border-[#9bcf77]/60" />
        </div>
      </div>
    );
  }

  if (variant === "onion") {
    return (
      <div className={`absolute ${className}`} aria-hidden="true">
        <div className="relative h-24 w-24 rotate-[18deg] drop-shadow-[0_16px_28px_rgba(0,0,0,0.28)]">
          <div className="absolute left-3 top-5 h-14 w-14 rounded-full border-[10px] border-[#ceb8da] bg-transparent" />
          <div className="absolute left-5 top-7 h-10 w-10 rounded-full border border-[#f1e6fa]/50" />
          <div className="absolute left-11 top-1 h-4 w-2 rounded-full bg-[#8d5ba7]" />
          <div className="absolute right-1 top-8 h-10 w-10 rounded-full border-[7px] border-[#e4d4ed] bg-transparent" />
          <div className="absolute right-[0.65rem] top-[2.35rem] h-5 w-5 rounded-full border border-[#f7f1fb]/40" />
        </div>
      </div>
    );
  }

  return (
    <div className={`absolute ${className}`} aria-hidden="true">
      <div className="relative h-28 w-28 rotate-[-10deg] drop-shadow-[0_16px_28px_rgba(0,0,0,0.28)]">
        <div className="absolute left-0 top-4 h-14 w-16 rounded-[55%_45%_50%_50%] border border-[#cde7aa]/30 bg-gradient-to-br from-[#e8f6c9] via-[#c6e48d] to-[#7faa48]" />
        <div className="absolute left-6 top-0 h-16 w-18 rounded-[50%_50%_45%_55%] border border-[#d8efba]/30 bg-gradient-to-br from-[#edf8d5] via-[#d6efab] to-[#82ab4d]" />
        <div className="absolute left-10 top-8 h-14 w-16 rounded-[48%_52%_50%_50%] border border-[#cde7aa]/30 bg-gradient-to-br from-[#e6f4c7] via-[#c4e090] to-[#719541]" />
      </div>
    </div>
  );
}

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

        <SpiceCup className="left-[6%] top-16 hidden md:block" tone="gold" />
        <SpiceCup className="right-[9%] top-20 hidden lg:block" tone="red" />
        <SpiceCup className="right-[18%] bottom-10 hidden md:block" tone="green" />
        <VegCluster className="left-[-0.5rem] top-24 hidden md:block" variant="tomato" />
        <VegCluster className="left-[13%] bottom-4 hidden lg:block" variant="cucumber" />
        <VegCluster className="right-[4%] top-12 hidden md:block" variant="onion" />
        <VegCluster className="right-[14%] bottom-2 hidden lg:block" variant="cabbage" />
        <VegCluster className="left-[50%] top-6 hidden xl:block" variant="tomato" />

        <div className="absolute left-4 top-4 z-10 md:left-8 md:top-6">
          <HeaderLogo size="customer" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-20 md:px-6 md:pb-16 md:pt-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center lg:gap-12 lg:px-8 lg:pt-28">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-black/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-brand-gold backdrop-blur-sm">
              <Flame size={12} className="text-brand-gold" />
              Fresh off the grill
            </div>

            <h1 className="mt-5 text-4xl font-black leading-none tracking-[-0.04em] text-white md:text-6xl xl:text-[4.5rem]">
              Home of Suya,
              <span className="block bg-gold-gradient bg-clip-text text-transparent">layered with fire, spice and crunch</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/78 md:text-base">
              Nigerian barbecue built around smoky meat, pepper heat, and the fresh bite of tomatoes, onions, cucumber and sliced cabbage.
            </p>

            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-red px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-brand-red/25 transition-transform transition-colors hover:-translate-y-0.5 hover:bg-brand-red-light"
              >
                <ShoppingBag size={16} />
                Order Now
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-gold/45 bg-black/25 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-brand-gold backdrop-blur-sm transition-transform transition-colors hover:-translate-y-0.5 hover:border-brand-gold hover:text-white"
              >
                <PartyPopper size={16} />
                Catering / Contact Us
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                <Clock size={12} className="text-brand-gold" />
                Tuesdays &amp; Thursdays only
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                <MapPin size={12} className="text-brand-gold" />
                Pickup · Cardiff Delivery · UK Postage
              </span>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4 lg:justify-start">
              <div className="h-px w-16 bg-gold-gradient opacity-80" />
              <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">
                Food made to order
              </p>
            </div>
          </div>

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
