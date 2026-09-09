"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame, Loader2, CheckCircle } from "lucide-react";
import { inputCls } from "@/components/ui/FormField";

type State = "idle" | "loading" | "success" | "error";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) { setMessage("Please paste your reset token"); return; }
    if (password !== confirm) { setMessage("Passwords do not match"); return; }
    if (password.length < 8) { setMessage("Password must be at least 8 characters"); return; }

    setState("loading");
    const res = await fetch("/api/admin/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword: confirm }),
    });
    const data = await res.json();

    if (res.ok) {
      setState("success");
      setMessage("Password updated! Redirecting to login...");
      setTimeout(() => router.push("/admin/login"), 2000);
    } else {
      setState("error");
      setMessage(data.error ?? "Something went wrong");
    }
  }

  return (
    <main className="min-h-screen bg-brand-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Flame size={36} className="text-brand-gold mx-auto" />
          <h1 className="text-white font-black text-2xl">Reset Password</h1>
          <p className="text-gray-500 text-sm">Check your email for the reset token</p>
        </div>

        {state === "success" ? (
          <div className="card p-6 text-center space-y-3">
            <CheckCircle size={40} className="text-green-400 mx-auto" />
            <p className="text-white font-semibold">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Reset Token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => { setToken(e.target.value); setMessage(""); }}
                placeholder="Paste token from email"
                className={inputCls()}
              />
              <p className="text-xs text-gray-500">Token was sent to your email address</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setMessage(""); }}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                className={inputCls()}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setMessage(""); }}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className={inputCls()}
              />
            </div>

            {message && (
              <p className={`text-xs ${state === "error" ? "text-brand-red" : "text-brand-red"}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={state === "loading"}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {state === "loading" && <Loader2 size={16} className="animate-spin" />}
              Update Password
            </button>

            <div className="text-center">
              <Link href="/admin/forgot-password" className="text-gray-500 hover:text-white text-xs transition-colors">
                Request new reset token
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
