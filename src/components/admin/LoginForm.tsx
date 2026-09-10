"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("expired") === "true";

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({} as { error?: string }));

    setLoading(false);

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(
        typeof data.error === "string" && data.error
          ? data.error
          : res.status >= 500
            ? "Sign-in failed due to a server error. Try again shortly."
            : "Invalid username or password"
      );
    }
  }

  return (
    <>
      {isExpired && (
        <div className="bg-brand-red/20 border border-brand-red rounded-lg p-3 text-sm text-brand-red">
          Your session has expired. Please log in again.
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-300" htmlFor="username">
            Username or email
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            placeholder="Enter username or email"
            className="w-full bg-surface-dark border border-surface-border rounded-xl
                       px-4 py-3 text-white placeholder-gray-600 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-red
                       focus:border-transparent transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-300" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full bg-surface-dark border border-surface-border rounded-xl
                         px-4 py-3 text-white placeholder-gray-600 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-red
                         focus:border-transparent transition-all pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <p className="text-brand-red text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Sign In
        </button>

        <div className="text-center pt-1">
          <Link
            href="/admin/forgot-password"
            className="text-gray-500 hover:text-brand-gold text-xs transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </form>
    </>
  );
}
