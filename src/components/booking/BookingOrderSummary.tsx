"use client";

import { ShoppingBag, Calendar, Clock, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { formatBookingDate, formatTimeSlot } from "@/lib/availability";

interface BookingOrderSummaryProps {
  deliveryFee: number;
  total: number;
}

const DELIVERY_LABELS: Record<string, string> = {
  PICKUP: "Pickup",
  CARDIFF: "Cardiff Delivery",
  POSTAGE: "UK Postage",
};

export function BookingOrderSummary({
  deliveryFee,
  total,
}: BookingOrderSummaryProps) {
  const { state, subtotal } = useCart();

  return (
    <div className="card p-5 sticky top-20">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-surface-border">
        <ShoppingBag size={18} className="text-brand-gold" />
        <h3 className="text-white font-bold">Order Summary</h3>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {state.items.map((item) => (
          <div key={item.mealId} className="flex justify-between text-sm">
            <span className="text-gray-400 truncate max-w-[60%]">
              {item.mealName}{" "}
              <span className="text-gray-600">×{item.quantity}</span>
            </span>
            <span className="text-white shrink-0">
              {formatCurrency(item.unitPrice * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Subtotal + delivery */}
      <div className="border-t border-surface-border pt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Subtotal</span>
          <span className="text-white">{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Delivery</span>
          <span className="text-white">
            {state.deliveryType
              ? deliveryFee === 0
                ? "Free"
                : formatCurrency(deliveryFee)
              : "—"}
          </span>
        </div>

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
      </div>

      {/* Total */}
      <div className="border-t border-surface-border mt-3 pt-3 flex justify-between items-center">
        <span className="text-white font-bold">Total</span>
        <span className="text-brand-gold font-black text-xl">
          {formatCurrency(total)}
        </span>
      </div>

      {/* Booking details (shown as selected) */}
      {(state.bookingDate || state.timeSlot || state.deliveryType) && (
        <div className="mt-4 pt-4 border-t border-surface-border space-y-2">
          {state.bookingDate && (
            <div className="flex items-start gap-2 text-xs">
              <Calendar size={13} className="text-brand-gold mt-0.5 shrink-0" />
              <span className="text-gray-300">
                {formatBookingDate(state.bookingDate)}
              </span>
            </div>
          )}
          {state.timeSlot && (
            <div className="flex items-center gap-2 text-xs">
              <Clock size={13} className="text-brand-gold shrink-0" />
              <span className="text-gray-300">
                {formatTimeSlot(state.timeSlot)}
              </span>
            </div>
          )}
          {state.deliveryType && (
            <div className="flex items-center gap-2 text-xs">
              <Truck size={13} className="text-brand-gold shrink-0" />
              <span className="text-gray-300">
                {DELIVERY_LABELS[state.deliveryType]}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
