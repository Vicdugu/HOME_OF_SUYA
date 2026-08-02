"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  ShoppingBag,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { DEFAULT_DELIVERY_SETTINGS } from "@/lib/delivery-settings";
import { getDeliveryFee } from "@/lib/delivery-pricing";
import { formatMealVariationSummary } from "@/lib/meal-variations";
import { formatCurrency } from "@/lib/utils";
import { formatBookingDate, formatTimeSlot } from "@/lib/availability";

const STEPS = [
  { n: 1, label: "Menu" },
  { n: 2, label: "Date & Delivery" },
  { n: 3, label: "Your Details" },
  { n: 4, label: "Payment" },
];

type PaymentMethod = "sumup" | "stripe";

export default function PaymentPage() {
  const router = useRouter();
  const { state, subtotal, totalItems, clearCart } = useCart();

  const [settings, setSettings] = useState(DEFAULT_DELIVERY_SETTINGS);
  const [loading, setLoading] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Guards
  useEffect(() => {
    if (totalItems === 0) router.replace("/");
    else if (!state.bookingDate || !state.timeSlot || !state.deliveryType)
      router.replace("/book");
    else if (!state.customerName || !state.customerWhatsapp)
      router.replace("/checkout");
  }, [
    totalItems,
    state.bookingDate,
    state.timeSlot,
    state.deliveryType,
    state.customerName,
    state.customerWhatsapp,
    router,
  ]);

  useEffect(() => {
    fetch("/api/delivery-settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  const deliveryFee = getDeliveryFee(state.deliveryType, subtotal, settings);

  const total = subtotal + deliveryFee - state.promoDiscount;

  async function handlePay(method: PaymentMethod) {
    setLoading(method);
    setError(null);

    try {
      // Step 1 — create booking
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: state.items,
          deliveryType: state.deliveryType,
          deliveryFee,
          subtotal,
          discount: state.promoDiscount,
          total,
          bookingDate: state.bookingDate,
          timeSlot: state.timeSlot,
          customerName: state.customerName,
          customerWhatsapp: state.customerWhatsapp,
          customerEmail: state.customerEmail,
          customerAddress: state.customerAddress,
          customerNotes: state.customerNotes,
          promoCode: state.promoCode,
        }),
      });

      const booking = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(booking.error ?? "Booking failed");

      // Step 2 — create payment session
      const paymentEndpoint = "/api/payments/sumup";

      const payRes = await fetch(paymentEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          reference: booking.reference,
          total,
          items: state.items,
          deliveryFee,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error ?? "Payment setup failed");

      // Step 3 — redirect to payment provider
      clearCart();
      window.location.href = payData.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  }

  if (totalItems === 0) return null;

  return (
    <main className="min-h-screen bg-brand-black">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="bg-surface-dark border-b border-surface-border sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            href="/checkout"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm shrink-0"
          >
            <ArrowLeft size={15} />
            Your Details
          </Link>

          <ol className="hidden sm:flex items-center gap-1">
            {STEPS.map(({ n, label }) => {
              const active = n === 4;
              const done = n < 4;
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
          <span className="hidden sm:block" />
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-white font-black text-2xl md:text-3xl mb-1">
            Payment
          </h1>
          <p className="text-gray-400 text-sm flex items-center gap-1.5">
            <Lock size={13} className="text-brand-gold" />
            Secure payment — your order is held until payment completes
          </p>
        </div>

        {/* ── Order summary ────────────────────────────────── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-brand-gold" />
            <h2 className="text-white font-bold text-sm">Order Summary</h2>
          </div>

          {/* Items */}
          <div className="space-y-1.5">
            {state.items.map((item) => (
              <div
                key={item.cartItemId}
                className="flex justify-between gap-3 text-sm"
              >
                <div className="text-gray-400 max-w-[70%]">
                  <span>
                    {item.mealName} <span className="text-gray-600">×{item.quantity}</span>
                  </span>
                  <p className="text-[11px] text-gray-600 mt-0.5">{formatMealVariationSummary(item)}</p>
                </div>
                <span className="text-white">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Booking details */}
          <div className="pt-3 border-t border-surface-border space-y-1 text-xs text-gray-500">
            {state.bookingDate && (
              <p>{formatBookingDate(state.bookingDate)}</p>
            )}
            {state.timeSlot && <p>{formatTimeSlot(state.timeSlot)}</p>}
            {state.deliveryType && (
              <p>
                {state.deliveryType === "PICKUP"
                  ? "Pickup"
                  : state.deliveryType === "CARDIFF"
                  ? "Cardiff Delivery"
                  : "UK Postage"}
              </p>
            )}
          </div>

          {/* Totals */}
          <div className="pt-3 border-t border-surface-border space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white">{formatCurrency(subtotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Delivery</span>
                <span className="text-white">{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            {state.promoDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-green-400">
                  Promo ({state.promoCode})
                </span>
                <span className="text-green-400">
                  -{formatCurrency(state.promoDiscount)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-surface-border">
              <span className="text-white font-bold">Total</span>
              <span className="text-brand-gold font-black text-xl">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Error ────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-red/10 border border-brand-red/30 text-sm">
            <AlertCircle
              size={16}
              className="text-brand-red mt-0.5 shrink-0"
            />
            <div>
              <p className="text-white font-medium">Payment failed</p>
              <p className="text-gray-400 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Payment buttons ───────────────────────────────── */}
        <div className="space-y-3">
          {/* SumUp — primary */}
          <button
            onClick={() => handlePay("sumup")}
            disabled={!!loading}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {loading === "sumup" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CreditCard size={18} />
            )}
            {loading === "sumup" ? "Redirecting to SumUp…" : "Pay with SumUp"}
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs">
          By paying you agree to our terms. A WhatsApp confirmation will be
          sent to {state.customerWhatsapp} once payment is confirmed.
        </p>
      </div>
    </main>
  );
}
