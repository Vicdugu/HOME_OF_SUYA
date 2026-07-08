"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { DatePicker } from "@/components/booking/DatePicker";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { DeliverySelector } from "@/components/booking/DeliverySelector";
import { BookingOrderSummary } from "@/components/booking/BookingOrderSummary";
import { MOCK_DELIVERY_SETTINGS } from "@/lib/mock-data";

const STEPS = [
  { n: 1, label: "Menu" },
  { n: 2, label: "Date & Delivery" },
  { n: 3, label: "Your Details" },
  { n: 4, label: "Payment" },
];

export default function BookPage() {
  const router = useRouter();
  const { state, setDate, setTimeSlot, setDelivery, subtotal, totalItems } =
    useCart();

  // If cart is empty, send back to menu
  useEffect(() => {
    if (totalItems === 0) router.replace("/");
  }, [totalItems, router]);

  const settings = MOCK_DELIVERY_SETTINGS;

  const deliveryFee =
    !state.deliveryType || state.deliveryType === "PICKUP"
      ? 0
      : state.deliveryType === "CARDIFF"
      ? settings.cardiffFee
      : settings.postageFee;

  const total = subtotal + deliveryFee - state.promoDiscount;

  const canProceed =
    !!state.bookingDate && !!state.timeSlot && !!state.deliveryType;

  if (totalItems === 0) return null;

  return (
    <main className="min-h-screen bg-brand-black">
      {/* ── Sticky header ───────────────────────────────────────── */}
      <div className="bg-surface-dark border-b border-surface-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm shrink-0"
          >
            <ArrowLeft size={15} />
            Menu
          </Link>

          {/* Progress steps */}
          <ol className="hidden sm:flex items-center gap-1">
            {STEPS.map(({ n, label }) => {
              const active = n === 2;
              const done = n < 2;
              return (
                <li key={n} className="flex items-center gap-1">
                  <span
                    className={[
                      "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                      done
                        ? "bg-brand-gold text-black"
                        : active
                        ? "bg-brand-red text-white"
                        : "bg-surface-border text-gray-500",
                    ].join(" ")}
                  >
                    {n}
                  </span>
                  <span
                    className={`text-xs ${active ? "text-white" : "text-gray-500"}`}
                  >
                    {label}
                  </span>
                  {n < STEPS.length && (
                    <span className="text-gray-700 text-xs mx-1">›</span>
                  )}
                </li>
              );
            })}
          </ol>

          <span className="text-gray-400 text-sm shrink-0 sm:hidden">
            Step 2 of 4
          </span>
          <span className="hidden sm:block" /> {/* spacer */}
        </div>
      </div>

      {/* ── Page body ────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Main flow ──────────────────────────────────────── */}
          <div className="flex-1 space-y-10 min-w-0">
            <div>
              <h1 className="text-white font-black text-2xl md:text-3xl mb-1">
                Date &amp; Delivery
              </h1>
              <p className="text-gray-400 text-sm">
                We cook on Tuesdays &amp; Fridays only.
              </p>
            </div>

            {/* Step 1 — Date */}
            <section>
              <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-black flex items-center justify-center">
                  1
                </span>
                Select a Date
              </h2>
              <DatePicker
                selectedDate={state.bookingDate}
                onSelect={setDate}
              />
            </section>

            {/* Step 2 — Time slot (appears once date chosen) */}
            {state.bookingDate && (
              <section>
                <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-black flex items-center justify-center">
                    2
                  </span>
                  Select a Time Slot
                </h2>
                <TimeSlotPicker
                  selectedSlot={state.timeSlot}
                  onSelect={setTimeSlot}
                />
              </section>
            )}

            {/* Step 3 — Delivery (appears once slot chosen) */}
            {state.timeSlot && (
              <section>
                <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-black flex items-center justify-center">
                    3
                  </span>
                  Choose Delivery Type
                </h2>
                <DeliverySelector
                  selected={state.deliveryType}
                  onSelect={setDelivery}
                  cardiffFee={settings.cardiffFee}
                  postageFee={settings.postageFee}
                  postageAvailable={settings.postageAvailable}
                />
              </section>
            )}

            {/* Continue CTA */}
            {canProceed && (
              <button
                onClick={() => router.push("/checkout")}
                className="btn-primary w-full max-w-xl flex items-center justify-center gap-2 py-4 text-base"
              >
                Continue to Your Details
                <ArrowRight size={18} />
              </button>
            )}
          </div>

          {/* ── Sidebar ────────────────────────────────────────── */}
          <aside className="lg:w-72 shrink-0">
            <BookingOrderSummary deliveryFee={deliveryFee} total={total} />
          </aside>
        </div>
      </div>
    </main>
  );
}
