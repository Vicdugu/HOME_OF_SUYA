"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Flame,
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Settings,
  LogOut,
  Tag,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/meals", label: "Meals", icon: UtensilsCrossed },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/promo-codes", label: "Promo Codes", icon: Tag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavLinks({
  pathname,
  onNav,
}: {
  pathname: string;
  onNav?: () => void;
}) {
  return (
    <>
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNav}
            className={[
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              active
                ? "bg-brand-red text-white"
                : "text-gray-400 hover:text-white hover:bg-surface-border",
            ].join(" ")}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-brand-black flex">
      {/* ── Desktop sidebar ────────────────────────────────── */}
      <aside className="hidden md:flex w-56 shrink-0 bg-surface-dark border-r border-surface-border flex-col">
        <div className="px-4 py-5 border-b border-surface-border flex items-center gap-2">
          <Flame size={20} className="text-brand-gold" />
          <span className="text-white font-bold text-sm leading-tight">
            Malam Suya
            <br />
            <span className="text-gray-500 font-normal text-xs">Admin</span>
          </span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="px-2 py-4 border-t border-surface-border">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-gray-500 hover:text-white hover:bg-surface-border
                       text-sm transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay nav ─────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={[
          "fixed top-0 left-0 h-full w-64 z-50 flex flex-col",
          "bg-surface-dark border-r border-surface-border",
          "transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="px-4 py-5 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={20} className="text-brand-gold" />
            <span className="text-white font-bold text-sm">Malam Suya Admin</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-gray-500 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          <NavLinks pathname={pathname} onNav={() => setMobileOpen(false)} />
        </nav>
        <div className="px-2 py-4 border-t border-surface-border">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-gray-500 hover:text-white hover:bg-surface-border text-sm transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface-dark border-b border-surface-border">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-brand-gold" />
            <span className="text-white font-bold text-sm">Admin</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

