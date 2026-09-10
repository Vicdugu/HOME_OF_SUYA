"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, CheckCircle, Clock, Loader2, X } from "lucide-react";

interface Admin {
  id: string;
  fullName: string | null;
  username: string;
  email: string | null;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
}

const EMPTY_FORM = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  role: "ADMIN",
  status: "ACTIVE",
};

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/accounts")
      .then((r) => r.json())
      .then((data) => {
        const adminsList = data?.data ? data.data : (Array.isArray(data) ? data : []);
        setAdmins(adminsList);
      });
  }, []);

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.username.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Name, username, email, and password are required");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm(EMPTY_FORM);
      setAdmins((prev) => [data.admin, ...prev]);
    } else {
      setError(data.error ?? "Failed to create admin");
    }
  }

  async function deleteAdmin(id: string, username: string) {
    if (!confirm(`Delete admin "${username}"? This cannot be undone.`)) return;
    const res = await fetch("/api/admin/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setAdmins((prev) => prev.filter((a) => a.id !== id));
    } else {
      const data = await res.json();
      alert(data.error ?? "Could not delete admin");
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-2xl">Admin Accounts</h1>
          <p className="text-gray-500 text-sm">{admins.length} account{admins.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); }}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Plus size={15} /> Create Account
        </button>
      </div>

      {/* Create admin form */}
      {showForm && (
        <div className="card p-5 space-y-4 border-brand-red/40">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold">Create Admin Account</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={createAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-gray-400 font-medium">Full name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => { setForm((f) => ({ ...f, fullName: e.target.value })); setError(""); }}
                  placeholder="e.g. Maryam Bello"
                  className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => { setForm((f) => ({ ...f, username: e.target.value })); setError(""); }}
                  placeholder="e.g. maryam"
                  className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setError(""); }}
                  placeholder="admin@example.com"
                  className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setError(""); }}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => { setForm((f) => ({ ...f, role: e.target.value })); setError(""); }}
                  className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => { setForm((f) => ({ ...f, status: e.target.value })); setError(""); }}
                  className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </div>
            </div>
            {error && <p className="text-brand-red text-xs">{error}</p>}
            <p className="text-gray-500 text-xs">
              This form creates the account immediately. The new user can sign in right away with the username or email and password entered here.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Create Account
            </button>
          </form>
        </div>
      )}

      {/* Accounts list */}
      <div className="space-y-3">
        {admins.map((admin) => (
          <div key={admin.id} className="card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-semibold truncate">{admin.fullName || admin.username}</p>
                <span className="rounded-full border border-brand-gold/30 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-brand-gold">
                  {admin.role}
                </span>
                {admin.status === "ACTIVE" ? (
                  <span className="flex items-center gap-1 text-green-400 text-xs">
                    <CheckCircle size={12} /> Active
                  </span>
                ) : admin.status === "PENDING" || !admin.isVerified ? (
                  <span className="flex items-center gap-1 text-amber-400 text-xs">
                    <Clock size={12} /> Pending
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400 text-xs">
                    <Clock size={12} /> Disabled
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-xs mt-0.5">@{admin.username}</p>
              <p className="text-gray-500 text-xs mt-0.5">{admin.email ?? "No email"}</p>
              <p className="text-gray-600 text-xs">
                Created {new Date(admin.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => deleteAdmin(admin.id, admin.username)}
                title="Delete admin"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-brand-red hover:bg-surface-border transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {admins.length === 0 && (
          <p className="text-gray-600 text-sm">No admin accounts found.</p>
        )}
      </div>
    </div>
  );
}
