"use client";

import { Suspense } from "react";
import { Flame } from "lucide-react";
import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-brand-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Flame size={36} className="text-brand-gold mx-auto" />
          <h1 className="text-white font-black text-2xl">Admin Login</h1>
          <p className="text-gray-500 text-sm">Home of Suya</p>
        </div>

        <Suspense fallback={<div className="card p-6 h-64 bg-surface-dark animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
