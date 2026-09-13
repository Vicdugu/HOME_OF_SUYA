"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { formatBookingDate, formatTimeSlot } from "@/lib/availability";
import { OrderDetailsModal } from "@/components/admin/OrderDetailsModal";
import { Download, Trash2 } from "lucide-react";

interface BookingItem { mealName: string; quantity: number; unitPrice: number }
interface Booking {
  id: string; reference: string; customerName: string; whatsapp: string;
  email: string | null; address: string | null; deliveryType: string; bookingDate: string;
  timeSlot: string; status: string; paymentStatus: string;
  fulfilmentStage: string; deliveryFee: number;
  customerRequestType: string | null;
  customerRequestMessage: string | null;
  customerRequestStatus: string | null;
  total: number; createdAt: string;
  items: BookingItem[];
}

const STATUS_COLOURS: Record<string, string> = {
  CONFIRMED: "bg-green-600/20 text-green-400",
  PENDING:   "bg-amber-600/20 text-amber-400",
  CANCELLED: "bg-red-600/20 text-red-400",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetch("/api/admin/bookings")
      .then((r) => {
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const bookingsList = data?.data ? data.data : (Array.isArray(data) ? data : []);
        setBookings(bookingsList);
      })
      .catch((err) => console.error("Failed to load bookings:", err));
  }, []);

  async function updateBooking(
    id: string,
    patch: Partial<Pick<Booking, "status" | "fulfilmentStage" | "customerRequestStatus">>
  ) {
    await fetch("/api/admin/bookings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, ...patch } : b));
  }

  async function deleteBooking(id: string, reference: string) {
    const confirmed = window.confirm(`Delete booking ${reference}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(typeof data?.error === "string" ? data.error : "Could not delete booking");
      }

      setBookings((prev) => prev.filter((booking) => booking.id !== id));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not delete booking");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = bookings.filter((b) => {
    const matchStatus = filter === "ALL" || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || b.customerName.toLowerCase().includes(q) ||
      b.reference.toLowerCase().includes(q) || b.whatsapp.includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black text-2xl">Bookings</h1>
          <p className="text-gray-500 text-sm">{filtered.length} of {bookings.length} shown</p>
        </div>
        <a
          href="/api/admin/bookings/export"
          target="_blank"
          className="btn-gold flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Download size={15} />
          Export CSV
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name, reference, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface-dark border border-surface-border rounded-xl px-4 py-2
                     text-white placeholder-gray-600 text-sm flex-1 min-w-48
                     focus:outline-none focus:ring-2 focus:ring-brand-red"
        />
        <div className="flex gap-2">
          {["ALL", "PENDING", "CONFIRMED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={[
                "px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                filter === s
                  ? "bg-brand-red text-white"
                  : "bg-surface-dark border border-surface-border text-gray-400 hover:text-white",
              ].join(" ")}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-dark border-b border-surface-border">
              <tr>
                {["Reference", "Customer", "Date", "Delivery", "Total", "Status", "Stage", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium text-xs uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-surface-dark/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="text-brand-gold hover:text-brand-gold-light hover:underline cursor-pointer transition-colors font-semibold"
                    >
                      {b.reference}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{b.customerName}</p>
                    <p className="text-gray-500 text-xs">{b.whatsapp}</p>
                    {b.customerRequestType ? (
                      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-amber-400">
                        {b.customerRequestType} request{b.customerRequestStatus ? ` · ${b.customerRequestStatus}` : ""}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    {formatBookingDate(b.bookingDate.slice(0, 10))}
                    <span className="block text-gray-500">{formatTimeSlot(b.timeSlot)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{b.deliveryType}</td>
                  <td className="px-4 py-3 text-white font-semibold">{formatCurrency(b.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLOURS[b.status] ?? ""}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={b.fulfilmentStage}
                      onChange={(e) => updateBooking(b.id, { fulfilmentStage: e.target.value })}
                      className="bg-surface-dark border border-surface-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                    >
                      <option value="RECEIVED">Received</option>
                      <option value="PREPARING">Preparing</option>
                      <option value="READY">Ready</option>
                      <option value="OUT_FOR_DELIVERY">Out for delivery</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <select
                        value={b.status}
                        onChange={(e) => updateBooking(b.id, { status: e.target.value })}
                        className="bg-surface-dark border border-surface-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      {b.customerRequestType ? (
                        <select
                          value={b.customerRequestStatus ?? "OPEN"}
                          onChange={(e) => updateBooking(b.id, { customerRequestStatus: e.target.value })}
                          className="bg-surface-dark border border-surface-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                        >
                          <option value="OPEN">Request open</option>
                          <option value="REVIEWED">Request reviewed</option>
                          <option value="RESOLVED">Request resolved</option>
                        </select>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => deleteBooking(b.id, b.reference)}
                        disabled={deletingId === b.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 transition-colors hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        {deletingId === b.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedBooking && (
        <OrderDetailsModal
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          order={selectedBooking}
        />
      )}
    </div>
  );
}
