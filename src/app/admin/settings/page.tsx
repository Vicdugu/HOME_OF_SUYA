"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Save, CalendarOff, Trash2, Plus, Upload, X } from "lucide-react";
import { isBookableDay, toDateString } from "@/lib/availability";
import {
  DISCOUNTED_POSTAGE_FEE,
  DISCOUNTED_POSTAGE_THRESHOLD,
} from "@/lib/delivery-pricing";
import type { DeliverySettingsDTO } from "@/types";

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml"]);

interface Settings extends DeliverySettingsDTO {
}

interface BlockedDate { id: string; date: string; reason: string | null }

function getRenderableLogoUrl(imageUrl: string | null | undefined) {
  const normalized = String(imageUrl ?? "").trim();

  if (!normalized) {
    return null;
  }

  if (
    normalized.startsWith("data:") ||
    normalized.startsWith("/") ||
    /^https?:\/\//i.test(normalized)
  ) {
    return normalized;
  }

  return null;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [brandingBusy, setBrandingBusy] = useState(false);
  const [brandingError, setBrandingError] = useState("");
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const previewLogoUrl = getRenderableLogoUrl(settings?.logoUrl);

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

  function openLogoPicker() {
    setBrandingError("");
    logoInputRef.current?.click();
  }

  async function handleLogoSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !settings) {
      return;
    }

    const fileName = file.name.toLowerCase();
    const hasAllowedExtension = fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".svg");

    if (!hasAllowedExtension || (file.type && !ACCEPTED_LOGO_TYPES.has(file.type))) {
      setBrandingError("Logo must be a PNG, JPG, JPEG, or SVG file.");
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setBrandingError("Logo must be 2MB or smaller.");
      return;
    }

    setBrandingBusy(true);
    setBrandingError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/settings/logo", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not upload logo");
      }

      setSettings((current) => current ? { ...current, logoUrl: data.logoUrl ?? null } : current);
    } catch (error) {
      setBrandingError(error instanceof Error ? error.message : "Could not upload logo");
    } finally {
      setBrandingBusy(false);
    }
  }

  async function removeLogo() {
    if (!settings) {
      return;
    }

    setBrandingBusy(true);
    setBrandingError("");

    try {
      const response = await fetch("/api/admin/settings/logo", {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not remove logo");
      }

      setSettings((current) => current ? { ...current, logoUrl: data.logoUrl ?? null } : current);
    } catch (error) {
      setBrandingError(error instanceof Error ? error.message : "Could not remove logo");
    } finally {
      setBrandingBusy(false);
    }
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
        <p className="text-xs text-gray-500">
          Orders above GBP {DISCOUNTED_POSTAGE_THRESHOLD} automatically use a UK postage fee of GBP {DISCOUNTED_POSTAGE_FEE}. The postage fee set above applies to smaller orders.
        </p>
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

      <section className="card p-5 space-y-5">
        <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest">Branding</h2>
        <input
          ref={logoInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={handleLogoSelected}
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={openLogoPicker}
            disabled={brandingBusy}
            className="group relative flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-surface-border bg-surface-dark transition-colors hover:border-brand-red/50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {previewLogoUrl ? (
              <img
                src={previewLogoUrl}
                alt="Site logo preview"
                className="h-full w-full object-contain p-3"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Upload size={18} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Upload Logo</span>
              </div>
            )}
            {brandingBusy && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 size={18} className="animate-spin text-white" />
              </div>
            )}
          </button>

          <div className="space-y-3">
            <p className="max-w-md text-xs text-gray-500">
              Click the logo box to upload a PNG, JPG, JPEG, or SVG. The uploaded logo is stored automatically and shown in the top-right corner of both the admin area and the customer-facing site.
            </p>
            <p className="text-xs text-gray-600">Maximum file size: 2MB</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openLogoPicker}
                disabled={brandingBusy}
                className="rounded-xl border border-surface-border px-4 py-2 text-sm text-white transition-colors hover:border-brand-red/40 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {previewLogoUrl ? "Replace Logo" : "Choose Logo"}
              </button>
              <button
                type="button"
                onClick={removeLogo}
                disabled={brandingBusy || !previewLogoUrl}
                className="rounded-xl border border-surface-border px-4 py-2 text-sm text-gray-300 transition-colors hover:border-brand-red/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-2">
                  <X size={14} /> Remove Logo
                </span>
              </button>
            </div>
            {brandingError ? <p className="text-xs text-brand-red">{brandingError}</p> : null}
          </div>
        </div>
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
