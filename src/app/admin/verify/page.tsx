"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Flame, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { inputCls } from "@/components/ui/FormField";

type State = "idle" | "loading" | "success" | "error";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setMessage("Passwords do not match"); return; }
    if (password.length < 8) { setMessage("Password must be at least 8 characters"); return; }

    setState("loading");
    const res = await fetch("/api/admin/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword: confirm }),
    });
    const data = await res.json();

    if (res.ok) {
      setState("success");
      setMessage(`Account activated! Welcome, ${data.username}. Redirecting to login...`);
      setTimeout(() => router.push("/admin/login"), 2500);
    } else {
      setState("error");
      setMessage(data.error ?? "Something went wrong");
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-brand-black flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <AlertCircle size={40} className="text-brand-red mx-auto" />
          <p className="text-white font-bold">Invalid verification link</p>
          <Link href="/admin/login" className="text-brand-gold text-sm hover:underline">
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Flame size={36} className="text-brand-gold mx-auto" />
          <h1 className="text-white font-black text-2xl">Activate Account</h1>
          <p className="text-gray-500 text-sm">Set your password to get started</p>
        </div>

        {state === "success" ? (
          <div className="card p-6 text-center space-y-3">
            <CheckCircle size={40} className="text-green-400 mx-auto" />
            <p className="text-white font-semibold">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">New Password</label>
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setMessage(""); }} placeholder="Min. 8 characters" autoComplete="new-password" className={inputCls()} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Confirm Password</label>
              <input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setMessage(""); }} placeholder="Repeat your password" autoComplete="new-password" className={inputCls()} />
            </div>
            {message && <p className="text-brand-red text-xs">{message}</p>}
            <button type="submit" disabled={state === "loading"} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {state === "loading" && <Loader2 size={16} className="animate-spin" />}
              Activate Account
            </button>
          </form>
        )}

        <div className="text-center">
          <Link href="/admin/login" className="text-gray-600 hover:text-white text-xs transition-colors">Back to login</Link>
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-brand-black flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-gold" />
      </main>
    }>
      <VerifyForm />
    </Suspense>
  );
}

