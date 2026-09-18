import Link from "next/link";
import { Flame, MapPin, Clock, PartyPopper, ShoppingBag } from "lucide-react";
import { HeaderLogo } from "@/components/ui/HeaderLogo";
import { ClientMenuSection } from "@/app/_components/ClientMenuSection";
import type { MealDTO } from "@/types";

// Revalidate static page every 60 seconds
export const revalidate = 60;

async function getMeals(): Promise<MealDTO[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/meals`, {
      // Ensure data is fresh at build time
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function MenuPage() {
  const meals = await getMeals();

  return (
    <main className="min-h-screen bg-white pt-16 sm:pt-0">
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
                Home of Suya / BBQ
              </h1>
              <h2 className="bg-gold-gradient bg-clip-text text-[0.9rem] font-bold leading-tight tracking-[-0.02em] text-transparent md:text-[1.6rem] xl:text-[1.9rem]">
                layered with fire, spice and crunchy flavours
              </h2>
            </div>

            <p className="mt-2 hidden text-sm leading-6 text-white md:block md:max-w-2xl md:text-sm md:mx-auto">
              Nigerian barbecue built around smoky meat, pepper heat, and the fresh bite of onions, cabbage, drinks and other delicacies.
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
      <section className="bg-black border-b border-surface-border">
        <div className="max-w-5xl mx-auto px-4 py-2">
          <ol className="flex flex-row items-center justify-center gap-2 sm:gap-5 text-xs text-white overflow-x-auto sm:overflow-visible">
            {[
              { step: "1", label: "Pick your meals below" },
              { step: "2", label: "Choose date & delivery" },
              { step: "3", label: "Enter your details" },
              { step: "4", label: "Pay & get confirmed" },
            ].map(({ step, label }, idx) => (
              <li key={step} className="flex items-center gap-1 sm:gap-2 shrink-0 sm:shrink">
                {idx === 0 && <span className="hidden sm:inline mr-2">Steps to order</span>}
                <span className="h-5 w-5 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {step}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Client-side menu section ──────────────────────────── */}
      <ClientMenuSection meals={meals} />
    </main>
  );
}
