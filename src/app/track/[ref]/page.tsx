"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Flame,
  Calendar,
  Truck,
  Package,
  MapPin,
  ArrowLeft,
  Loader2,
  Send,
} from "lucide-react";
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
  deliveryType: string;
  address: string | null;
  bookingDate: string;
  timeSlot: string;
  status: string;
  paymentStatus: string;
  fulfilmentStage: string;
  customerRequestType: string | null;
  customerRequestMessage: string | null;
  customerRequestStatus: string | null;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  createdAt: string;
  items: BookingItem[];
}

const STATUS_CONFIG = {
  CONFIRMED: {
    icon: <CheckCircle size={48} className="text-green-400" />,
    label: "Booking Confirmed",
    colour: "text-green-400",
    bg: "bg-green-400/10 border-green-400/20",
  },
  PENDING: {
    icon: <Clock size={48} className="text-brand-gold" />,
    label: "Awaiting Payment",
    colour: "text-brand-gold",
    bg: "bg-brand-gold/10 border-brand-gold/20",
  },
  CANCELLED: {
    icon: <XCircle size={48} className="text-brand-red" />,
    label: "Booking Cancelled",
    colour: "text-brand-red",
    bg: "bg-brand-red/10 border-brand-red/20",
  },
} as const;

const DELIVERY_ICONS: Record<string, React.ReactNode> = {
  PICKUP: <MapPin size={16} className="text-brand-gold" />,
  CARDIFF: <Truck size={16} className="text-brand-gold" />,
  POSTAGE: <Package size={16} className="text-brand-gold" />,
};

const DELIVERY_LABELS: Record<string, string> = {
  PICKUP: "Pickup",
  CARDIFF: "Cardiff Delivery",
  POSTAGE: "UK Postage",
};

export default function TrackRefPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [ref, setRef] = useState("");
  const [requestType, setRequestType] = useState<"CANCEL" | "RESCHEDULE">("CANCEL");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);
  const [resumeBusy, setResumeBusy] = useState(false);

  useEffect(() => {
    params.then(({ ref: r }) => setRef(r));
  }, [params]);

  useEffect(() => {
    if (!ref) return;
    fetch(`/api/bookings/${ref}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { setBooking(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ref]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-gold" />
      </div>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-brand-black flex flex-col items-center justify-center gap-6 px-4 text-center">
        <Flame size={40} className="text-gray-600" />
        <div>
          <p className="text-white font-bold text-xl mb-1">Booking not found</p>
          <p className="text-gray-400 text-sm">
            Reference <span className="font-mono text-gray-300">{ref}</span> doesn't exist.
          </p>
        </div>
        <Link href="/track" className="btn-primary px-6 py-3">Try Again</Link>
      </main>
    );
  }

  const statusKey = booking.status as keyof typeof STATUS_CONFIG;
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.PENDING;

  async function handleRequest() {
    if (!booking) {
      return;
    }

    if (requestMessage.trim().length < 10) {
      setRequestFeedback("Please provide more detail for the team.");
      return;
    }

    setRequestBusy(true);
    setRequestFeedback(null);

    try {
      const response = await fetch(`/api/bookings/${booking.reference}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType, message: requestMessage.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not send request");
      }

      setBooking((current) => current ? {
        ...current,
        customerRequestType: requestType,
        customerRequestMessage: requestMessage.trim(),
        customerRequestStatus: "OPEN",
      } : current);
      setRequestMessage("");
      setRequestFeedback(typeof data.message === "string" ? data.message : "Your request has been sent.");
    } catch (error) {
      setRequestFeedback(error instanceof Error ? error.message : "Could not send request");
    } finally {
      setRequestBusy(false);
    }
  }

  async function resumePayment() {
    if (!booking) {
      return;
    }

    setResumeBusy(true);
    setRequestFeedback(null);

    try {
      const response = await fetch("/api/payments/sumup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, reference: booking.reference }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not resume payment");
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      setRequestFeedback(error instanceof Error ? error.message : "Could not resume payment");
      setResumeBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-black">
      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">

        {/* Back */}
        <Link href="/track" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={14} />
          Track another order
        </Link>

        {/* Status card */}
        <div className={`card p-6 border text-center space-y-3 ${statusCfg.bg}`}>
          <div className="flex justify-center">{statusCfg.icon}</div>
          <p className={`font-black text-xl ${statusCfg.colour}`}>{statusCfg.label}</p>
          <p className="text-gray-400 text-sm font-mono">{booking.reference}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
            Stage: {booking.fulfilmentStage.replace(/_/g, " ")}
          </p>
        </div>

        {booking.paymentStatus === "UNPAID" && booking.status === "PENDING" ? (
          <div className="card p-5 space-y-3 border border-brand-gold/20 bg-brand-gold/5">
            <p className="text-white font-semibold">Payment not completed</p>
            <p className="text-sm text-gray-400">
              Your slot is only held briefly while payment is pending. Resume checkout below.
            </p>
            <button
              onClick={resumePayment}
              disabled={resumeBusy}
              className="btn-primary px-5 py-3 text-sm disabled:opacity-70"
            >
              {resumeBusy ? "Redirecting..." : "Resume Payment"}
            </button>
          </div>
        ) : null}

        {/* Booking details */}
        <div className="card p-5 space-y-4">
          <h2 className="text-white font-bold text-sm uppercase tracking-widest text-brand-gold">
            Booking Details
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-brand-gold shrink-0" />
              <span className="text-gray-300">
                {formatBookingDate(booking.bookingDate.slice(0, 10))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-brand-gold shrink-0" />
              <span className="text-gray-300">{formatTimeSlot(booking.timeSlot)}</span>
            </div>
            <div className="flex items-start gap-2">
              {DELIVERY_ICONS[booking.deliveryType]}
              <span className="text-gray-300">
                {DELIVERY_LABELS[booking.deliveryType] ?? booking.deliveryType}
                {booking.address && (
                  <span className="block text-gray-500 text-xs mt-0.5">{booking.address}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Order items */}
        <div className="card p-5 space-y-4">
          <h2 className="text-brand-gold font-bold text-sm uppercase tracking-widest">
            Your Order
          </h2>

          <div className="space-y-2">
            {booking.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-400">
                  {item.mealName} <span className="text-gray-600">x{item.quantity}</span>
                </span>
                <span className="text-white">{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-surface-border pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white">{formatCurrency(booking.subtotal)}</span>
            </div>
            {booking.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Delivery</span>
                <span className="text-white">{formatCurrency(booking.deliveryFee)}</span>
              </div>
            )}
            {booking.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-green-400">Discount</span>
                <span className="text-green-400">-{formatCurrency(booking.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-surface-border">
              <span className="text-white font-bold">Total</span>
              <span className="text-brand-gold font-black text-lg">{formatCurrency(booking.total)}</span>
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="text-brand-gold font-bold text-sm uppercase tracking-widest">
            Need to change this booking?
          </h2>
          <p className="text-sm text-gray-400">
            Send a cancellation or reschedule request directly to the team.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setRequestType("CANCEL")}
              className={`rounded-xl px-4 py-2 text-sm border ${requestType === "CANCEL" ? "border-brand-red bg-brand-red/10 text-white" : "border-surface-border text-gray-300"}`}
            >
              Cancellation request
            </button>
            <button
              type="button"
              onClick={() => setRequestType("RESCHEDULE")}
              className={`rounded-xl px-4 py-2 text-sm border ${requestType === "RESCHEDULE" ? "border-brand-red bg-brand-red/10 text-white" : "border-surface-border text-gray-300"}`}
            >
              Reschedule request
            </button>
          </div>
          <textarea
            rows={4}
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            placeholder="Tell us what you need changed and include any preferred new date or time."
            className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
          />
          {booking.customerRequestType ? (
            <div className="rounded-xl border border-surface-border bg-surface-dark/60 px-4 py-3 text-xs text-gray-300">
              <p className="font-semibold text-white">Latest request</p>
              <p className="mt-1 uppercase tracking-[0.16em] text-amber-400">
                {booking.customerRequestType} · {booking.customerRequestStatus ?? "OPEN"}
              </p>
              {booking.customerRequestMessage ? <p className="mt-2 text-gray-400">{booking.customerRequestMessage}</p> : null}
            </div>
          ) : null}
          {requestFeedback ? (
            <p className="text-sm text-gray-300 inline-flex items-center gap-2">
              <AlertCircle size={14} className="text-brand-gold" />
              {requestFeedback}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleRequest}
            disabled={requestBusy}
            className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm disabled:opacity-70"
          >
            {requestBusy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {requestBusy ? "Sending request..." : "Send request"}
          </button>
        </div>

        {/* Help */}
        <p className="text-center text-gray-600 text-xs">
          Questions? WhatsApp us — your confirmation message has our contact details.
        </p>
      </div>
    </main>
  );
}
