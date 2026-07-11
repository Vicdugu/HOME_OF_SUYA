import Link from "next/link";
import { Flame } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-brand-black flex flex-col items-center justify-center px-4 text-center gap-6">
      <Flame size={48} className="text-brand-red opacity-60" />
      <div>
        <h1 className="text-white font-black text-5xl mb-2">404</h1>
        <p className="text-gray-400 text-lg">Page not found</p>
      </div>
      <p className="text-gray-600 text-sm max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="btn-primary px-8 py-3">
        Back to Menu
      </Link>
    </main>
  );
}
