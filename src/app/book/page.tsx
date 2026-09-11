"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, PartyPopper } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { DatePicker } from "@/components/booking/DatePicker";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { DeliverySelector } from "@/components/booking/DeliverySelector";
import { BookingOrderSummary } from "@/components/booking/BookingOrderSummary";
import { trackClientEvent } from "@/lib/client-analytics";
import { DEFAULT_DELIVERY_SETTINGS } from "@/lib/delivery-settings";
import { getDeliveryFee } from "@/lib/delivery-pricing";
import type { DeliveryType } from "@/types";

const STEPS = [
  { n: 1, label: "Menu" },
  { n: 2, label: "Date & Delivery" },
  { n: 3, label: "Your Details" },
  { n: 4, label: "Payment" },
];

interface DeliverySettings {
  cardiffFee: number;
  postageFee: number;
  postageAvailable: boolean;
}

interface AvailabilityDay {
  date: string;
  cutoffAt: string;
  slots: Array<{
    id: string;
    label: string;
    remainingByDelivery: Record<DeliveryType, number>;
  }>;
}

export default function BookPage() {
  const router = useRouter();
  const { state, setDate, setTimeSlot, setDelivery, subtotal, totalItems } =
    useCart();

  const [settings, setSettings] = useState<DeliverySettings>(DEFAULT_DELIVERY_SETTINGS);
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDay[]>([]);

  // Redirect if cart empty
  useEffect(() => {
    if (totalItems === 0) router.replace("/");
  }, [totalItems, router]);

  // Fetch live delivery settings and availability
  useEffect(() => {
    trackClientEvent("view_booking_step", "book");
    fetch("/api/delivery-settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
    fetch("/api/availability")
      .then((r) => r.json())
      .then((data) => setAvailabilityDays(Array.isArray(data?.days) ? data.days : []))
      .catch(() => {});
  }, []);

  const availableDates = availabilityDays.map((day) => day.date);
  const selectedAvailability = availabilityDays.find((day) => day.date === state.bookingDate) ?? null;
  const slotStates = Object.fromEntries(
    (selectedAvailability?.slots ?? []).map((slot) => {
      const remaining = state.deliveryType ? slot.remainingByDelivery[state.deliveryType] ?? 0 : 0;
      return [
        slot.id,
        {
          remaining,
          isAvailable: Boolean(state.deliveryType) && remaining > 0,
        },
      ];
    })
  ) as Record<string, { remaining: number; isAvailable: boolean }>;

  const deliveryFee = getDeliveryFee(state.deliveryType, subtotal, settings);
  const displayedPostageFee = getDeliveryFee("POSTAGE", subtotal, settings);

  const total = subtotal + deliveryFee - state.promoDiscount;

  const canProceed =
    !!state.bookingDate && !!state.deliveryType && !!state.timeSlot && !!slotStates[state.timeSlot]?.isAvailable;

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
                We cook Monday to Saturday.
              </p>
              <div className="mt-5 h-px w-full max-w-xl bg-gradient-to-r from-brand-gold/70 via-white/20 to-transparent" />
              <Link
                href="/contact"
                className="mt-4 flex w-full max-w-xl items-center justify-between gap-4 rounded-2xl border border-brand-gold/50 bg-gradient-to-r from-brand-red via-[#8b0000] to-brand-black px-5 py-4 text-left shadow-lg shadow-brand-red/20 transition-transform transition-colors hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-brand-red/30"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-gold/90">
                    Contact Us
                  </p>
                  <p className="mt-1 text-base font-black uppercase tracking-[0.08em] text-white sm:text-lg">
                    Hosting a Party: CONTACT US
                  </p>
                  <p className="mt-1 text-xs text-white/75 sm:text-sm">
                    Planning catering, bulk trays, or a larger event? Send us your enquiry.
                  </p>
                </div>
                <PartyPopper className="h-6 w-6 shrink-0 text-brand-gold" />
              </Link>
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
                availableDates={availableDates}
                deliveryType={state.deliveryType}
              />
            </section>

            {/* Step 2 — Delivery (appears once date chosen) */}
            {state.bookingDate && (
              <section>
                <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-black flex items-center justify-center">
                    2
                  </span>
                  Choose Delivery Type
                </h2>
                <DeliverySelector
                  selected={state.deliveryType}
                  onSelect={setDelivery}
                  cardiffFee={settings.cardiffFee}
                  postageFee={displayedPostageFee}
                  postageAvailable={settings.postageAvailable}
                />
              </section>
            )}

            {/* Step 3 — Time slot (appears once delivery chosen) */}
            {state.bookingDate && state.deliveryType && (
              <section>
                <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-black flex items-center justify-center">
                    3
                  </span>
                  Select a Time Slot
                </h2>
                <TimeSlotPicker
                  slots={selectedAvailability?.slots ?? []}
                  selectedSlot={state.timeSlot}
                  onSelect={setTimeSlot}
                  slotStates={slotStates}
                />
                <p className="mt-3 max-w-xl text-xs text-gray-500">
                  Live slot availability is shown for your selected delivery option. Unpaid bookings only hold a slot briefly before it reopens.
                </p>
              </section>
            )}

            {/* Continue CTA */}
            {canProceed && (
              <div className="sticky bottom-4 z-10 md:static">
                <button
                  onClick={() => {
                    trackClientEvent("advance_to_checkout", "book", {
                      deliveryType: state.deliveryType,
                      bookingDate: state.bookingDate,
                      timeSlot: state.timeSlot,
                    });
                    router.push("/checkout");
                  }}
                  className="btn-primary w-full max-w-xl flex items-center justify-center gap-2 py-4 text-base shadow-xl shadow-brand-red/20"
                >
                  Continue to Your Details
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            <section className="card max-w-xl p-5 space-y-3">
              <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest">Before You Book</h2>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Orders close at 6:00 PM on the day before your selected booking date.</li>
                <li>Slots remain live and can sell out while unpaid bookings expire.</li>
                <li>If you need a larger catering order, use the Contact Us tab for a custom arrangement.</li>
              </ul>
            </section>
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
