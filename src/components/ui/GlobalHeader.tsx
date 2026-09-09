"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Phone, Home } from "lucide-react";
import { HeaderLogo } from "./HeaderLogo";

export default function GlobalHeader() {
  const pathname = usePathname();

  // Don't show on payment page or confirmation page
  if (pathname === "/payment" || pathname.startsWith("/confirmation/")) {
    return null;
  }

  const isHomePage = pathname === "/";

  return (
    <header className="sticky top-0 z-50 bg-brand-black/95 backdrop-blur border-b border-brand-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Home Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-gold/30 text-sm font-semibold text-brand-gold hover:bg-brand-gold/10 hover:border-brand-gold/50 transition"
          >
            <Home size={16} />
            <span className="hidden sm:inline">Home</span>
          </Link>

          {/* Center: Logo (only if not on home) */}
          {!isHomePage && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <Link href="/" className="inline-block">
                <HeaderLogo size="customer" />
              </Link>
            </div>
          )}

          {/* Right: Contact Details */}
          <div className="flex items-center gap-3 md:gap-6">
            <a
              href="mailto:homeofsuya@gmail.com"
              className="hidden sm:flex items-center gap-1.5 text-xs md:text-sm text-gray-300 hover:text-brand-gold transition"
            >
              <Mail size={14} className="text-brand-gold" />
              <span>homeofsuya@gmail.com</span>
            </a>
            <a
              href="tel:07467767223"
              className="hidden sm:flex items-center gap-1.5 text-xs md:text-sm text-gray-300 hover:text-brand-gold transition"
            >
              <Phone size={14} className="text-brand-gold" />
              <span>0746 7767223</span>
            </a>
            {/* Mobile contact icon */}
            <div className="sm:hidden flex items-center gap-2">
              <a
                href="mailto:homeofsuya@gmail.com"
                className="text-brand-gold hover:text-brand-gold-light transition"
              >
                <Mail size={16} />
              </a>
              <a
                href="tel:07467767223"
                className="text-brand-gold hover:text-brand-gold-light transition"
              >
                <Phone size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
