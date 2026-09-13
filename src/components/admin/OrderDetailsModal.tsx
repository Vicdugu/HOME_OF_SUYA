"use client";

import { X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatBookingDate, formatTimeSlot } from "@/lib/availability";

interface OrderItem {
  mealName: string;
  quantity: number;
  unitPrice?: number;
}

interface OrderDetailsModalProps {
  open: boolean;
  onClose: () => void;
  order: {
    reference: string;
    customerName: string;
    whatsapp: string;
    email?: string | null;
    bookingDate: string;
    timeSlot: string;
    deliveryType: string;
    address?: string | null;
    items: OrderItem[];
    total: number;
    deliveryFee: number;
  };
}

export function OrderDetailsModal({ open, onClose, order }: OrderDetailsModalProps) {
  if (!open) return null;

  const subtotal = order.items.reduce((sum, item) => sum + ((item.unitPrice ?? 0) * item.quantity), 0);

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Order details"
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className="bg-surface-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-surface-border">
          {/* Header */}
          <div className="sticky top-0 bg-surface-dark border-b border-surface-border px-6 py-4 flex items-center justify-between">
            <h2 className="text-white font-black text-xl">Order Details</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-full
                         text-gray-400 hover:text-white hover:bg-surface-border
                         transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Reference & Customer */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Reference</p>
                <p className="text-white font-mono font-bold text-lg">{order.reference}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Customer</p>
                <p className="text-white font-semibold">{order.customerName}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">WhatsApp</p>
                <p className="text-white font-mono text-sm">{order.whatsapp}</p>
              </div>
              {order.email && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Email</p>
                  <p className="text-white text-sm break-all">{order.email}</p>
                </div>
              )}
            </div>

            {/* Booking Details */}
            <div className="border-t border-surface-border pt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Date</p>
                <p className="text-white font-semibold">
                  {formatBookingDate(order.bookingDate.slice(0, 10))}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Time</p>
                <p className="text-white font-semibold">{formatTimeSlot(order.timeSlot)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Delivery</p>
                <p className="text-white font-semibold">{order.deliveryType}</p>
              </div>
            </div>

            {/* Address (if applicable) */}
            {order.address && (
              <div className="border-t border-surface-border pt-4">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Delivery Address</p>
                <p className="text-white text-sm bg-surface-dark rounded-lg p-3">{order.address}</p>
              </div>
            )}

            {/* Items Table */}
            <div className="border-t border-surface-border pt-4">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Items</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="text-left text-gray-400 font-semibold py-2 px-3 text-xs">Item</th>
                      <th className="text-center text-gray-400 font-semibold py-2 px-3 text-xs">Qty</th>
                      <th className="text-right text-gray-400 font-semibold py-2 px-3 text-xs">Unit Price</th>
                      <th className="text-right text-gray-400 font-semibold py-2 px-3 text-xs">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-dark/50 transition-colors">
                        <td className="py-2 px-3 text-white">{item.mealName}</td>
                        <td className="py-2 px-3 text-white text-center font-semibold">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-3 text-white text-right">
                          {item.unitPrice ? formatCurrency(item.unitPrice) : "—"}
                        </td>
                        <td className="py-2 px-3 text-white text-right font-semibold">
                          {item.unitPrice ? formatCurrency(item.unitPrice * item.quantity) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="border-t border-surface-border pt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Delivery Fee</span>
                  <span className="text-white font-semibold">{formatCurrency(order.deliveryFee)}</span>
                </div>
              )}
              <div className="border-t border-surface-border pt-2 flex justify-between items-center">
                <span className="text-white font-bold">Total</span>
                <span className="text-brand-gold font-black text-xl">{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Close Button */}
            <div className="border-t border-surface-border pt-4">
              <button
                onClick={onClose}
                className="w-full py-2 px-4 bg-surface-dark border border-surface-border rounded-lg text-white hover:bg-surface-dark/80 transition-colors font-semibold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
