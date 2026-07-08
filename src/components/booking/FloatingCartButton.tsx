"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";

interface FloatingCartButtonProps {
  onClick: () => void;
}

export function FloatingCartButton({ onClick }: FloatingCartButtonProps) {
  const { totalItems, subtotal } = useCart();

  if (totalItems === 0) return null;

  return (
    <button
      onClick={onClick}
      aria-label={`View cart — ${totalItems} item${totalItems > 1 ? "s" : ""}`}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30
                 flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl
                 bg-brand-red hover:bg-brand-red-light active:scale-95
                 transition-all duration-200 ease-in-out
                 border border-brand-red-light/30"
    >
      <div className="relative">
        <ShoppingBag size={20} className="text-white" />
        <span className="absolute -top-2 -right-2 bg-brand-gold text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      </div>
      <span className="text-white font-semibold text-sm">
        View Order
      </span>
      <span className="text-white/80 font-bold text-sm">
        {formatCurrency(subtotal)}
      </span>
    </button>
  );
}
