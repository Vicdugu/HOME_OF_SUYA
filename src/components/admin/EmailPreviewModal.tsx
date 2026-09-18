"use client";

import { useState } from "react";
import { X, Mail, AlertCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface EmailPreviewModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  customerEmail: string;
  onConfirm?: () => void;
}

interface EmailData {
  reference: string;
  customerName: string;
  bookingDate: string;
  timeSlot: string;
  deliveryType: string;
  address?: string | null;
  total: number;
  items: Array<{
    mealName: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentLink: string;
}

export function EmailPreviewModal({
  open,
  onClose,
  bookingId,
  customerEmail,
  onConfirm,
}: EmailPreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [previewShown, setPreviewShown] = useState(false);

  if (!open) return null;

  // Load email preview
  const loadPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/bookings/${bookingId}/send-reminder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ previewOnly: true }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load preview");
      }

      const data = await res.json();
      setEmailData(data.emailData);
      setPreviewShown(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Send reminder email
  const sendReminder = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/bookings/${bookingId}/send-reminder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ previewOnly: false }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send reminder");
      }

      onConfirm?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // If preview not loaded yet, load it
  if (!previewShown) {
    if (!loading && !error) {
      loadPreview();
    }

    return (
      <>
        <div
          role="presentation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
        <div
          role="dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-surface-card rounded-2xl shadow-2xl max-w-md w-full border border-surface-border p-6">
            <div className="text-center">
              {loading ? (
                <>
                  <Loader2 className="mx-auto mb-4 animate-spin text-brand-red" size={32} />
                  <p className="text-white font-semibold">Loading email preview...</p>
                </>
              ) : error ? (
                <>
                  <AlertCircle className="mx-auto mb-4 text-red-400" size={32} />
                  <p className="text-red-400 font-semibold mb-2">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      loadPreview();
                    }}
                    className="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!emailData) {
    return null;
  }

  const addressLine = emailData.address
    ? ` → ${emailData.address}`
    : "";

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Email preview"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-surface-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-surface-border flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-surface-dark border-b border-surface-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail size={20} className="text-brand-gold" />
              <h2 className="text-white font-black text-lg">Email Preview</h2>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-surface-border transition-colors disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          {/* Email Preview */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Email Container */}
            <div className="max-w-2xl mx-auto bg-white rounded-lg overflow-hidden shadow-lg">
              {/* Email Header */}
              <div
                style={{
                  background: "linear-gradient(135deg, #C41E3A, #8B0000)",
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                <h1
                  style={{
                    color: "#D4AF37",
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: 900,
                    letterSpacing: "-0.5px",
                  }}
                >
                  Home of Suya
                </h1>
              </div>

              {/* Email Body */}
              <div style={{ padding: "32px 28px", color: "#E0E0E0" }}>
                <h2
                  style={{
                    color: "#fff",
                    marginTop: 0,
                    fontSize: "18px",
                  }}
                >
                  Don't miss out on your booking!
                </h2>

                <p>
                  Hi <strong style={{ color: "#D4AF37" }}>{emailData.customerName}</strong>,
                </p>

                <p>
                  You have a pending booking with us that needs payment to be
                  confirmed. Your reservation will only be locked in once
                  payment is complete.
                </p>

                {/* Booking Details */}
                <div
                  style={{
                    background: "#111827",
                    borderRadius: "8px",
                    padding: "16px",
                    margin: "24px 0",
                    borderLeft: "4px solid #C41E3A",
                  }}
                >
                  <p style={{ margin: "8px 0", fontSize: "14px" }}>
                    <strong>Booking Reference:</strong>
                    <br />
                    <span
                      style={{
                        color: "#D4AF37",
                        fontSize: "16px",
                        fontWeight: "bold",
                      }}
                    >
                      {emailData.reference}
                    </span>
                  </p>
                  <p style={{ margin: "8px 0", fontSize: "14px" }}>
                    <strong>Booking Date & Time:</strong>
                    <br />
                    {emailData.bookingDate} — {emailData.timeSlot}
                  </p>
                  <p style={{ margin: "8px 0", fontSize: "14px" }}>
                    <strong>Delivery Type:</strong>
                    <br />
                    {emailData.deliveryType}
                    {addressLine}
                  </p>
                  <p style={{ margin: "8px 0", fontSize: "14px" }}>
                    <strong>Amount to Pay:</strong>
                    <br />
                    <span
                      style={{
                        color: "#D4AF37",
                        fontSize: "16px",
                        fontWeight: "bold",
                      }}
                    >
                      {formatCurrency(emailData.total)}
                    </span>
                  </p>
                </div>

                {/* Items Table */}
                <table
                  style={{
                    borderCollapse: "collapse",
                    width: "100%",
                    margin: "16px 0",
                    fontSize: "13px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#C41E3A", color: "#fff" }}>
                      <th
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          fontWeight: "bold",
                        }}
                      >
                        Item
                      </th>
                      <th
                        style={{
                          padding: "8px 12px",
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        Qty
                      </th>
                      <th
                        style={{
                          padding: "8px 12px",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailData.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #e0e0e0" }}>
                        <td
                          style={{
                            padding: "8px 12px",
                            textAlign: "left",
                          }}
                        >
                          {item.mealName}
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            textAlign: "center",
                          }}
                        >
                          {item.quantity}
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            textAlign: "right",
                          }}
                        >
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* CTA Button */}
                <div style={{ textAlign: "center", margin: "28px 0" }}>
                  <a
                    href={emailData.paymentLink}
                    style={{
                      background: "#C41E3A",
                      color: "#fff",
                      textDecoration: "none",
                      padding: "14px 32px",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "15px",
                      display: "inline-block",
                    }}
                  >
                    Complete Payment
                  </a>
                </div>

                {/* Additional Info */}
                <p style={{ fontSize: "13px", color: "#888", marginTop: "24px" }}>
                  <strong>Why complete payment now?</strong>
                  <br />
                  Completing your payment within the next 30 minutes ensures
                  your booking is locked in and your delivery slot is reserved.
                  Without payment, your booking may become available for other
                  customers.
                </p>

                <p style={{ fontSize: "13px", color: "#888" }}>
                  <strong>Need help?</strong>
                  <br />
                  Contact us on WhatsApp or reply to this email if you have any
                  questions about your booking.
                </p>
              </div>

              {/* Email Footer */}
              <div
                style={{
                  padding: "16px 28px",
                  borderTop: "1px solid #2A2A2A",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "#555", fontSize: "11px", margin: 0 }}>
                  This is a reminder for your pending booking.
                  <br />
                  Please complete payment to confirm your reservation.
                </p>
              </div>
            </div>
          </div>

          {/* Footer with Actions */}
          <div className="border-t border-surface-border px-6 py-4 bg-surface-dark space-y-3">
            {error && (
              <div className="flex gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-surface-border border border-surface-border rounded-lg text-white hover:bg-surface-border/80 transition-colors font-semibold text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={sendReminder}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-brand-red text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Sending..." : "Send Reminder"}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Email will be sent to: <span className="text-white">{customerEmail}</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
