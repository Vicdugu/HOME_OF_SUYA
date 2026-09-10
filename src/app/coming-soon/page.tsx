"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { HeaderLogo } from "@/components/ui/HeaderLogo";

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");

    try {
      // TODO: Connect to email signup endpoint
      // For now, just simulate submission
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
      setEmail("");
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-black">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-80">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255, 176, 59, 0.15) 0%, transparent 40%),
                                radial-gradient(circle at 80% 70%, rgba(196, 30, 58, 0.15) 0%, transparent 40%),
                                radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)`,
            }}
          />
        </div>
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255, 176, 59, 0.15) 0%, transparent 40%),
                              radial-gradient(circle at 80% 70%, rgba(196, 30, 58, 0.15) 0%, transparent 40%),
                              radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)`,
            animationDuration: "15s",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="h-20 w-24 animate-pulse rounded-2xl bg-gradient-to-br from-brand-gold via-brand-red to-brand-black shadow-2xl shadow-brand-red/20 sm:h-24 sm:w-32">
              <div className="flex h-full w-full items-center justify-center">
                <HeaderLogo size="customer" />
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="mb-6 flex items-center justify-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 backdrop-blur-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-gold animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">
              Coming Very Soon
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-3 text-4xl font-black leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
            Home of Suya / BBQ
          </h1>

          {/* Subtitle */}
          <p className="mb-6 text-lg font-bold uppercase tracking-widest text-brand-gold sm:text-xl">
            Authentic Nigerian BBQ
          </p>

          {/* Description */}
          <p className="mb-12 text-base leading-relaxed text-white/80 sm:text-lg">
            Experience the bold flavours of authentic Northern Nigerian BBQ — smoky,
            spiced to perfection, and delivered straight to your door. From Cardiff to
            across the UK, we&apos;re bringing home the heat.
          </p>

          {/* Email Signup */}
          <form onSubmit={handleSubmit} className="mb-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email for launch updates"
              required
              className="rounded-xl border-2 border-brand-gold/30 bg-white/5 px-5 py-4 text-white placeholder-white/50 transition-all duration-200 backdrop-blur-sm hover:border-brand-gold/50 focus:border-brand-gold focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-brand-gold/20 sm:min-w-96"
            />
            <button
              type="submit"
              disabled={loading}
              className="whitespace-nowrap rounded-xl bg-gradient-to-r from-brand-red to-red-800 px-8 py-4 font-black uppercase tracking-wider text-white shadow-lg shadow-brand-red/30 transition-all duration-200 hover:shadow-xl hover:shadow-brand-red/50 disabled:opacity-50 sm:px-6"
            >
              {loading ? "Subscribing..." : submitted ? "✓ Subscribed!" : "Notify Me"}
            </button>
          </form>

          {error && <p className="mb-6 text-sm text-brand-red">{error}</p>}

          {/* Contact Section */}
          <div className="border-t border-brand-gold/20 pt-12">
            <p className="mb-3 text-xs uppercase tracking-widest text-white/60">
              Questions? Get in touch
            </p>
            <a
              href="mailto:homeofsuya@gmail.com"
              className="inline-flex items-center gap-2 text-2xl font-bold text-brand-gold transition-colors hover:text-brand-gold-light sm:text-3xl"
            >
              homeofsuya@gmail.com
            </a>
          </div>

          {/* Tagline */}
          <p className="mt-12 text-sm text-white/60">
            🍖 Grill House • Cardiff, UK 🍖
          </p>
        </div>
      </div>
    </main>
  );
}
