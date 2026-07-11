"use client";

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
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/meals", label: "Meals", icon: UtensilsCrossed },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/promo-codes", label: "Promo Codes", icon: Tag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-brand-black flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-surface-dark border-r border-surface-border flex flex-col">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-surface-border flex items-center gap-2">
          <Flame size={20} className="text-brand-gold" />
          <span className="text-white font-bold text-sm leading-tight">
            Malam Suya<br />
            <span className="text-gray-500 font-normal text-xs">Admin</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
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
        </nav>

        {/* Sign out */}
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

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
