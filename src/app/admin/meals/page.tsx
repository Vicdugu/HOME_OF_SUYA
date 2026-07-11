"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Meal {
  id: string; name: string; description: string;
  price: number; imageUrl: string; isAvailable: boolean; sortOrder: number;
}

const EMPTY: Omit<Meal, "id"> = {
  name: "", description: "", price: 0,
  imageUrl: "", isAvailable: true, sortOrder: 0,
};

export default function AdminMealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [editing, setEditing] = useState<string | null>(null); // meal id or "new"
  const [form, setForm] = useState<Omit<Meal, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/meals").then((r) => r.json()).then(setMeals);
  }, []);

  function startNew() { setEditing("new"); setForm(EMPTY); }
  function startEdit(m: Meal) {
    setEditing(m.id);
    setForm({ name: m.name, description: m.description, price: m.price,
               imageUrl: m.imageUrl, isAvailable: m.isAvailable, sortOrder: m.sortOrder });
  }
  function cancel() { setEditing(null); }

  async function save() {
    setSaving(true);
    if (editing === "new") {
      const res = await fetch("/api/admin/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const meal = await res.json();
      setMeals((prev) => [...prev, meal]);
    } else {
      await fetch(`/api/admin/meals/${editing}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setMeals((prev) => prev.map((m) => m.id === editing ? { ...m, ...form } : m));
    }
    setSaving(false);
    setEditing(null);
  }

  async function deleteMeal(id: string) {
    if (!confirm("Delete this meal?")) return;
    await fetch(`/api/admin/meals/${id}`, { method: "DELETE" });
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  async function toggleAvailable(m: Meal) {
    await fetch(`/api/admin/meals/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, isAvailable: !m.isAvailable }),
    });
    setMeals((prev) => prev.map((x) => x.id === m.id ? { ...x, isAvailable: !x.isAvailable } : x));
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-2xl">Meals</h1>
          <p className="text-gray-500 text-sm">{meals.length} meals on the menu</p>
        </div>
        <button onClick={startNew} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus size={15} /> Add Meal
        </button>
      </div>

      {/* Add / Edit form */}
      {editing && (
        <div className="card p-5 space-y-4 border-brand-red/40">
          <h2 className="text-white font-bold">{editing === "new" ? "New Meal" : "Edit Meal"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Name", type: "text" },
              { key: "price", label: "Price (£)", type: "number" },
              { key: "imageUrl", label: "Image URL", type: "text" },
              { key: "sortOrder", label: "Sort Order", type: "number" },
            ].map(({ key, label, type }) => (
              <div key={key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-400">{label}</label>
                <input
                  type={type}
                  value={(form as Record<string, unknown>)[key] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? e.target.value : e.target.value }))}
                  className="w-full bg-surface-dark border border-surface-border rounded-xl
                             px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-400">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full bg-surface-dark border border-surface-border rounded-xl
                         px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
              className="rounded"
            />
            Available for ordering
          </label>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save
            </button>
            <button onClick={cancel} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-surface-border text-gray-400 hover:text-white text-sm transition-colors">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Meals list */}
      <div className="space-y-3">
        {meals.map((m) => (
          <div key={m.id} className={`card p-4 flex items-center gap-4 ${!m.isAvailable ? "opacity-50" : ""}`}>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold">{m.name}</p>
              <p className="text-gray-500 text-xs truncate">{m.description}</p>
            </div>
            <span className="text-brand-gold font-bold shrink-0">{formatCurrency(m.price)}</span>
            <button
              onClick={() => toggleAvailable(m)}
              className={`px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${
                m.isAvailable ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-400"
              }`}
            >
              {m.isAvailable ? "Available" : "Hidden"}
            </button>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => startEdit(m)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-surface-border transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => deleteMeal(m.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-red transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
