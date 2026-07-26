"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Loader2, CheckCircle } from "lucide-react";
import { inputCls } from "@/components/ui/FormField";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email"); return; }

    setLoading(true);
    setError("");

    await fetch("/api/admin/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    setLoading(false);
    setDone(true);
  }

  return (
    <main className="min-h-screen bg-brand-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Flame size={36} className="text-brand-gold mx-auto" />
          <h1 className="text-white font-black text-2xl">Forgot Password</h1>
          <p className="text-gray-500 text-sm">Enter your admin email to receive a reset link</p>
        </div>

        {done ? (
          <div className="card p-6 text-center space-y-3">
            <CheckCircle size={40} className="text-green-400 mx-auto" />
            <p className="text-white font-semibold">Check your email</p>
            <p className="text-gray-400 text-sm">
              If that address is registered, we&apos;ve sent a password reset link. It expires in 1 hour.
            </p>
            <Link href="/admin/login" className="block text-brand-gold text-sm hover:underline mt-2">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="your@email.com"
                autoComplete="email"
                className={inputCls()}
              />
            </div>

            {error && <p className="text-brand-red text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Send Reset Link
            </button>

            <div className="text-center">
              <Link href="/admin/login" className="text-gray-500 hover:text-white text-xs transition-colors">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
