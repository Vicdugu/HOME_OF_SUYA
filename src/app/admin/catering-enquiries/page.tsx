"use client";

import { useEffect, useState } from "react";
import type { CateringEnquiryDTO } from "@/types";

const STATUS_OPTIONS = ["NEW", "CONTACTED", "QUOTED", "BOOKED", "CLOSED"] as const;

export default function AdminCateringEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<CateringEnquiryDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/catering-enquiries")
      .then((r) => {
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const enquiriesList = data?.data ? data.data : (Array.isArray(data) ? data : []);
        setEnquiries(enquiriesList);
      })
      .catch((err) => console.error("Failed to load enquiries:", err))
      .finally(() => setLoading(false));
  }, []);

  const selected = enquiries.find((entry) => entry.id === selectedId) ?? enquiries[0] ?? null;

  useEffect(() => {
    if (!selectedId && enquiries[0]) {
      setSelectedId(enquiries[0].id);
    }
  }, [enquiries, selectedId]);

  async function updateSelected(patch: Partial<CateringEnquiryDTO>) {
    if (!selected) return;
    setSaving(true);
    const response = await fetch("/api/admin/catering-enquiries", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, ...patch }),
    });
    const data = await response.json();
    setSaving(false);
    if (response.ok) {
      setEnquiries((current) => current.map((entry) => (entry.id === selected.id ? data : entry)));
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-white font-black text-2xl">Catering Enquiries</h1>
        <p className="text-gray-500 text-sm">Structured party and catering requests with quote tracking</p>
      </div>

      {loading ? <div className="card p-5 text-gray-500 text-sm">Loading enquiries...</div> : null}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="card overflow-hidden">
          <div className="divide-y divide-surface-border">
            {enquiries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedId(entry.id)}
                className={`w-full px-4 py-4 text-left transition-colors ${selected?.id === entry.id ? "bg-brand-red/10" : "hover:bg-surface-dark/50"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white font-semibold truncate">{entry.fullName}</p>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-brand-gold">{entry.status}</span>
                </div>
                <p className="mt-1 text-xs text-gray-400 truncate">{entry.email}</p>
                <p className="mt-1 text-xs text-gray-500 truncate">
                  {entry.eventDate ?? "Date TBC"} · {entry.guestCount ?? "Guests TBC"} · {entry.serviceStyle.replace(/_/g, " ")}
                </p>
              </button>
            ))}
            {enquiries.length === 0 ? <div className="p-5 text-sm text-gray-500">No catering enquiries yet.</div> : null}
          </div>
        </div>

        {selected ? (
          <div className="card p-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Customer</p>
                <p className="mt-1 text-white font-semibold">{selected.fullName}</p>
                <p className="text-sm text-gray-400">{selected.email}</p>
                <p className="text-sm text-gray-400">{selected.phone ?? "No phone provided"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Event</p>
                <p className="mt-1 text-white">{selected.eventDate ?? "Date TBC"}</p>
                <p className="text-sm text-gray-400">Guests: {selected.guestCount ?? "TBC"}</p>
                <p className="text-sm text-gray-400">Service: {selected.serviceStyle.replace(/_/g, " ")}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-400">Status</label>
                <select
                  value={selected.status}
                  onChange={(e) => void updateSelected({ status: e.target.value as CateringEnquiryDTO["status"] })}
                  className="mt-1 w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm"
                >
                  {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400">Quote Amount (£)</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={selected.quoteAmount ?? ""}
                  onBlur={(e) => void updateSelected({ quoteAmount: e.target.value ? Number(e.target.value) : null })}
                  className="mt-1 w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Venue</p>
                <p className="mt-1 text-sm text-gray-300">{selected.venue ?? "Not provided"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Budget / Area</p>
                <p className="mt-1 text-sm text-gray-300">{selected.budget ?? "Budget not provided"}</p>
                <p className="text-sm text-gray-400">{selected.deliveryArea ?? "Area not provided"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Customer Request</p>
              <div className="mt-2 rounded-xl border border-surface-border bg-surface-dark/60 p-4 text-sm text-gray-300 whitespace-pre-wrap">
                {selected.message}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-400">Quote Notes</label>
                <textarea
                  rows={5}
                  defaultValue={selected.quoteNotes ?? ""}
                  onBlur={(e) => void updateSelected({ quoteNotes: e.target.value || null })}
                  className="mt-1 w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400">Admin Notes</label>
                <textarea
                  rows={5}
                  defaultValue={selected.adminNotes ?? ""}
                  onBlur={(e) => void updateSelected({ adminNotes: e.target.value || null })}
                  className="mt-1 w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm resize-none"
                />
              </div>
            </div>

            {saving ? <p className="text-xs text-gray-500">Saving changes...</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}