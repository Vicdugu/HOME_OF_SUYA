"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-brand-black flex flex-col items-center justify-center px-4 text-center gap-6">
      <AlertTriangle size={48} className="text-brand-red opacity-70" />
      <div>
        <h1 className="text-white font-black text-2xl mb-2">Something went wrong</h1>
        <p className="text-gray-400 text-sm">
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <button onClick={reset} className="btn-primary px-8 py-3">
        Try Again
      </button>
    </main>
  );
}
