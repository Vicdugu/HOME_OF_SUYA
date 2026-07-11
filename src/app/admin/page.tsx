"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  UtensilsCrossed,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  todayBookings: number;
  activeMeals: number;
  totalRevenue: number;
}

function StatCard({
  label,
  value,
  icon,
  colour,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colour: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colour}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="text-white font-black text-xl">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-white font-black text-2xl">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your bookings and meals</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Bookings"
          value={stats?.totalBookings ?? "—"}
          icon={<ClipboardList size={18} className="text-white" />}
          colour="bg-brand-red"
        />
        <StatCard
          label="Confirmed"
          value={stats?.confirmedBookings ?? "—"}
          icon={<CheckCircle size={18} className="text-white" />}
          colour="bg-green-600"
        />
        <StatCard
          label="Pending Payment"
          value={stats?.pendingBookings ?? "—"}
          icon={<Clock size={18} className="text-white" />}
          colour="bg-amber-600"
        />
        <StatCard
          label="Today's Bookings"
          value={stats?.todayBookings ?? "—"}
          icon={<Calendar size={18} className="text-white" />}
          colour="bg-blue-600"
        />
        <StatCard
          label="Active Meals"
          value={stats?.activeMeals ?? "—"}
          icon={<UtensilsCrossed size={18} className="text-white" />}
          colour="bg-purple-600"
        />
        <StatCard
          label="Total Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : "—"}
          icon={<TrendingUp size={18} className="text-white" />}
          colour="bg-brand-gold/80"
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: "/admin/bookings", label: "View Bookings" },
          { href: "/admin/meals", label: "Manage Meals" },
          { href: "/admin/settings", label: "Delivery Settings" },
          { href: "/admin/promo-codes", label: "Promo Codes" },
          { href: "/admin/bookings?status=PENDING", label: "Pending Orders" },
          { href: "/api/admin/bookings/export", label: "Export CSV", external: true },
        ].map(({ href, label, external }) => (
          <Link
            key={href}
            href={href}
            target={external ? "_blank" : undefined}
            className="card p-4 text-center text-sm font-medium text-gray-300
                       hover:text-white hover:border-brand-red/40 transition-all"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
