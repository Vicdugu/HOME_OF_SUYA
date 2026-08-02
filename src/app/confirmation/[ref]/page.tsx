"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, MapPin, Flame, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatBookingDate, formatTimeSlot } from "@/lib/availability";

interface BookingItem {
  id: string;
  mealName: string;
  quantity: number;
  unitPrice: number;
}

interface Booking {
  id: string;
  reference: string;
  customerName: string;
  whatsapp: string;
  deliveryType: string;
  deliveryFee: number;
  subtotal: number;
  discount: number;
  total: number;
  bookingDate: string;
  timeSlot: string;
  status: string;
  paymentStatus: string;
  items: BookingItem[];
}

const DELIVERY_LABELS: Record<string, string> = {
  PICKUP: "Pickup",
  CARDIFF: "Cardiff Delivery",
  POSTAGE: "UK Postage",
};

export default function ConfirmationPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [ref, setRef] = useState<string>("");

  useEffect(() => {
    params.then(({ ref: r }) => setRef(r));
  }, [params]);

  useEffect(() => {
    if (!ref) return;
    fetch(`/api/bookings/${ref}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => { if (data) { setBooking(data); setLoading(false); } })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [ref]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-gold" />
      </div>
    );
  }

  if (notFound || !booking) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-white font-bold text-xl">Booking not found</p>
        <p className="text-gray-400 text-sm">
          Reference: <span className="font-mono">{ref}</span>
        </p>
        <Link href="/" className="btn-primary px-6 py-3">
          Back to Menu
        </Link>
      </div>
    );
  }

  const isPaid = booking.paymentStatus === "PAID";

  return (
    <main className="min-h-screen bg-brand-black">
      <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
        {/* ── Status banner ──────────────────────────────── */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            {isPaid ? (
              <CheckCircle size={56} className="text-green-400" />
            ) : (
              <Clock size={56} className="text-brand-gold" />
            )}
          </div>
          <h1 className="text-white font-black text-2xl md:text-3xl">
            {isPaid ? "Booking Confirmed!" : "Booking Received"}
          </h1>
          <p className="text-gray-400 text-sm">
            {isPaid
              ? `A WhatsApp confirmation has been sent to ${booking.whatsapp}`
              : "Your booking is awaiting payment confirmation."}
          </p>
          <div className="inline-block bg-surface-dark border border-surface-border rounded-xl px-5 py-2">
            <p className="text-gray-500 text-xs uppercase tracking-widest">
              Reference
            </p>
            <p className="text-brand-gold font-black text-lg font-mono tracking-wider">
              {booking.reference}
            </p>
          </div>
        </div>

        {/* ── Order details ───────────────────────────────── */}
        <div className="card p-5 space-y-4">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <Flame size={15} className="text-brand-gold" />
            Order Details
          </h2>

          {/* Items */}
          <div className="space-y-1.5">
            {booking.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-400">
                  {item.mealName}{" "}
                  <span className="text-gray-600">×{item.quantity}</span>
                </span>
                <span className="text-white">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-surface-border pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white">
                {formatCurrency(booking.subtotal)}
              </span>
            </div>
            {booking.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Delivery</span>
                <span className="text-white">
                  {formatCurrency(booking.deliveryFee)}
                </span>
              </div>
            )}
            {booking.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-green-400">Discount</span>
                <span className="text-green-400">
                  -{formatCurrency(booking.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-surface-border">
              <span className="text-white font-bold">Total Paid</span>
              <span className="text-brand-gold font-black text-lg">
                {formatCurrency(booking.total)}
              </span>
            </div>
          </div>

          {/* Booking info */}
          <div className="border-t border-surface-border pt-3 space-y-1.5 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-brand-gold shrink-0" />
              <span>
                {formatBookingDate(booking.bookingDate.slice(0, 10))} —{" "}
                {formatTimeSlot(booking.timeSlot)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={12} className="text-brand-gold shrink-0" />
              <span>{DELIVERY_LABELS[booking.deliveryType] ?? booking.deliveryType}</span>
            </div>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <Link href="/" className="btn-primary text-center py-3">
            Order Again
          </Link>
          <p className="text-center text-gray-600 text-xs">
            Save your reference number: <span className="font-mono text-gray-400">{booking.reference}</span>
          </p>
        </div>
      </div>
    </main>
  );
}
