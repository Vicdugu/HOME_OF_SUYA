"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, CalendarOff, Trash2, Plus } from "lucide-react";
import { isBookableDay, toDateString } from "@/lib/availability";

interface Settings {
  cardiffFee: number; postageFee: number; postageAvailable: boolean;
  minOrderCardiff: number; minOrderPostage: number;
}

interface BlockedDate { id: string; date: string; reason: string | null }

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then(setSettings);
    fetch("/api/admin/blocked-dates").then((r) => r.json()).then(setBlockedDates);
  }, []);

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function addBlockedDate() {
    if (!newDate) return;
    const [y, m, d] = newDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (!isBookableDay(date)) {
      alert("Only Tuesdays and Fridays can be blocked.");
      return;
    }
    const res = await fetch("/api/admin/blocked-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, reason: newReason }),
    });
    const blocked = await res.json();
    setBlockedDates((prev) => [...prev, blocked]);
    setNewDate(""); setNewReason("");
  }

  async function removeBlockedDate(id: string) {
    await fetch("/api/admin/blocked-dates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBlockedDates((prev) => prev.filter((d) => d.id !== id));
  }

  if (!settings) return (
    <div className="p-6 flex items-center gap-2 text-gray-500">
      <Loader2 size={16} className="animate-spin" /> Loading...
    </div>
  );

  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-white font-black text-2xl">Settings</h1>
        <p className="text-gray-500 text-sm">Delivery fees, availability, and blocked dates</p>
      </div>

      {/* Delivery settings */}
      <section className="card p-5 space-y-5">
        <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest">Delivery Fees</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "cardiffFee", label: "Cardiff Delivery Fee (£)" },
            { key: "postageFee", label: "UK Postage Fee (£)" },
            { key: "minOrderCardiff", label: "Min Order — Cardiff (£)" },
            { key: "minOrderPostage", label: "Min Order — Postage (£)" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <label className="block text-xs font-medium text-gray-400">{label}</label>
              <input
                type="number"
                step="0.01"
                value={(settings as unknown as Record<string, unknown>)[key] as number}
                onChange={(e) => setSettings((s) => s ? { ...s, [key]: parseFloat(e.target.value) || 0 } : s)}
                className="w-full bg-surface-dark border border-surface-border rounded-xl
                           px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>
          ))}
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.postageAvailable}
            onChange={(e) => setSettings((s) => s ? { ...s, postageAvailable: e.target.checked } : s)}
            className="rounded"
          />
          <span className="text-sm text-gray-300">UK Postage available</span>
        </label>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </section>

      {/* Blocked dates */}
      <section className="card p-5 space-y-5">
        <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest flex items-center gap-2">
          <CalendarOff size={14} /> Blocked Dates
        </h2>
        <p className="text-gray-500 text-xs">Block specific Tuesdays or Fridays (e.g. holidays, sold-out days).</p>

        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="bg-surface-dark border border-surface-border rounded-xl px-3 py-2
                       text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            className="flex-1 min-w-36 bg-surface-dark border border-surface-border rounded-xl px-3 py-2
                       text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          />
          <button
            onClick={addBlockedDate}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Plus size={14} /> Block
          </button>
        </div>

        <div className="space-y-2">
          {blockedDates.length === 0 && (
            <p className="text-gray-600 text-sm">No blocked dates.</p>
          )}
          {blockedDates.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 p-3 bg-surface-dark rounded-xl">
              <div>
                <span className="text-white text-sm font-mono">{d.date}</span>
                {d.reason && <span className="ml-2 text-gray-500 text-xs">{d.reason}</span>}
              </div>
              <button
                onClick={() => removeBlockedDate(d.id)}
                className="text-gray-500 hover:text-brand-red transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
