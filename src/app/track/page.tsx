"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame, Search, ArrowLeft } from "lucide-react";

export default function TrackPage() {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = ref.trim().toUpperCase();
    if (!trimmed) { setError("Please enter your booking reference"); return; }
    if (!trimmed.startsWith("MSS-")) {
      setError("References start with MSS- (e.g. MSS-ABC12345)");
      return;
    }
    router.push(`/track/${trimmed}`);
  }

  return (
    <main className="min-h-screen bg-brand-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Flame size={36} className="text-brand-gold mx-auto" />
          <h1 className="text-white font-black text-2xl">Track Your Order</h1>
          <p className="text-gray-400 text-sm">
            Enter the reference from your booking confirmation
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <label htmlFor="ref" className="block text-sm font-medium text-gray-300">
            Booking Reference
          </label>
          <input
            id="ref"
            type="text"
            value={ref}
            onChange={(e) => { setRef(e.target.value.toUpperCase()); setError(""); }}
            placeholder="MSS-ABC12345"
            autoComplete="off"
            className="w-full bg-surface-dark border border-surface-border rounded-xl
                       px-4 py-3 text-white placeholder-gray-600 font-mono tracking-wider
                       text-sm focus:outline-none focus:ring-2 focus:ring-brand-red
                       focus:border-transparent transition-all"
          />
          {error && <p className="text-brand-red text-xs">{error}</p>}
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            <Search size={16} />
            Find Booking
          </button>
        </form>

        <div className="text-center">
          <Link href="/" className="flex items-center justify-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors">
            <ArrowLeft size={14} />
            Back to Menu
          </Link>
        </div>
      </div>
    </main>
  );
}
