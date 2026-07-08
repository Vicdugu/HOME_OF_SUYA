"use client";

import { useState } from "react";
import { Tag, X, CheckCircle, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function PromoCodeInput() {
  const { state, subtotal, setPromo, clearPromo } = useCart();
  const [input, setInput] = useState(state.promoCode ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null
  );

  const applied = !!state.promoCode;

  async function handleApply() {
    if (!input.trim()) return;
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: input.trim(), subtotal }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.valid) {
      setPromo(data.code, data.discount);
      setMessage({ text: data.message, ok: true });
    } else {
      setMessage({ text: data.message, ok: false });
    }
  }

  function handleRemove() {
    clearPromo();
    setInput("");
    setMessage(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value.toUpperCase());
              setMessage(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && !applied && handleApply()}
            placeholder="PROMO CODE"
            disabled={applied}
            maxLength={20}
            className={[
              "w-full bg-surface-dark border rounded-xl pl-9 pr-4 py-3 text-white",
              "placeholder-gray-600 text-sm font-mono tracking-wider",
              "focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "transition-all",
              applied ? "border-green-600/50" : "border-surface-border",
            ].join(" ")}
          />
        </div>

        {applied ? (
          <button
            onClick={handleRemove}
            className="shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-xl
                       border border-surface-border text-gray-400 hover:text-white
                       hover:border-brand-red/50 text-sm transition-all"
          >
            <X size={14} />
            Remove
          </button>
        ) : (
          <button
            onClick={handleApply}
            disabled={loading || !input.trim()}
            className="btn-primary shrink-0 px-5 py-3 text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : "Apply"}
          </button>
        )}
      </div>

      {/* Feedback */}
      {message && (
        <p
          className={`flex items-center gap-1.5 text-xs ${
            message.ok ? "text-green-400" : "text-brand-red"
          }`}
        >
          {message.ok && <CheckCircle size={13} />}
          {message.text}
        </p>
      )}
    </div>
  );
}
