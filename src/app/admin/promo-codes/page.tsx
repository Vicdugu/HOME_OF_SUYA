"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Plus, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PromoCode {
  id: string; code: string; discountType: string; discountValue: number;
  minOrder: number; maxUses: number | null; usedCount: number;
  expiresAt: string | null; isActive: boolean; isHidden: boolean; createdAt: string;
}

const EMPTY = {
  code: "", discountType: "PERCENT", discountValue: 10,
  minOrder: 0, maxUses: "", expiresAt: "", isActive: true,
};

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/promo-codes")
      .then((r) => r.json())
      .then((data) => {
        const promoCodesList = data?.data ? data.data : (Array.isArray(data) ? data : []);
        setCodes(promoCodesList);
      });
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      }),
    });
    const code = await res.json();
    setCodes((prev) => [code, ...prev]);
    setSaving(false);
    setShowForm(false);
    setForm(EMPTY);
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch("/api/admin/promo-codes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    setCodes((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !isActive } : c));
  }

  async function remove(id: string) {
    if (!confirm("Delete this promo code?")) return;
    await fetch("/api/admin/promo-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCodes((prev) => prev.filter((c) => c.id !== id));
  }

  async function toggleHidden(id: string, isHidden: boolean) {
    const res = await fetch("/api/admin/promo-codes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isHidden: !isHidden }),
    });
    const updated = await res.json().catch(() => null);
    if (!res.ok || !updated) return;
    setCodes((prev) => prev.map((c) => c.id === id ? updated : c));
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-2xl">Promo Codes</h1>
          <p className="text-gray-500 text-sm">{codes.length} codes</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus size={15} /> New Code
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5 space-y-4 border-brand-red/40">
          <h2 className="text-white font-bold">Create Promo Code</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Code</label>
              <input type="text" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SUYA20"
                className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Discount Type</label>
              <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red">
                <option value="PERCENT">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (£)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Value ({form.discountType === "PERCENT" ? "%" : "£"})</label>
              <input type="number" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: Number(e.target.value) }))}
                className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Min Order (£)</label>
              <input type="number" value={form.minOrder} onChange={(e) => setForm((f) => ({ ...f, minOrder: Number(e.target.value) }))}
                className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Max Uses (blank = unlimited)</label>
              <input type="number" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Expires At (blank = never)</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving || !form.code} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null} Create
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-surface-border text-gray-400 hover:text-white text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {codes.map((c) => (
          <div key={c.id} className={`card p-4 flex items-center gap-4 ${!c.isActive || c.isHidden ? "opacity-60" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-brand-gold font-mono font-bold">{c.code}</p>
                {!c.isActive ? <span className="rounded-full border border-amber-500/30 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-amber-300">Inactive</span> : null}
                {c.isHidden ? <span className="rounded-full border border-surface-border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-gray-300">Hidden</span> : null}
              </div>
              <p className="text-gray-400 text-xs">
                {c.discountType === "PERCENT" ? `${c.discountValue}% off` : `£${c.discountValue} off`}
                {c.minOrder > 0 && ` · min £${c.minOrder}`}
                {c.maxUses && ` · ${c.usedCount}/${c.maxUses} used`}
                {c.expiresAt && ` · expires ${c.expiresAt.slice(0, 10)}`}
              </p>
            </div>
            <button onClick={() => toggle(c.id, c.isActive)} className="text-gray-400 hover:text-white transition-colors">
              {c.isActive ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} />}
            </button>
            <button onClick={() => toggleHidden(c.id, c.isHidden)} className="text-gray-400 hover:text-white transition-colors" title={c.isHidden ? "Unhide promo code" : "Hide promo code"}>
              {c.isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <button onClick={() => remove(c.id)} className="text-gray-500 hover:text-brand-red transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {codes.length === 0 && <p className="text-gray-600 text-sm">No promo codes yet.</p>}
      </div>
    </div>
  );
}
