"use client";

import { useEffect, useRef } from "react";
import { X, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { formatCurrency } from "@/lib/utils";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { state, setQuantity, removeItem, subtotal, totalItems } = useCart();
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleProceed = () => {
    onClose();
    router.push("/book");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your order"
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-surface-card border-l border-surface-border
                    z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
                    ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-gold" />
            <h2 className="text-white font-bold text-lg">Your Order</h2>
            {totalItems > 0 && (
              <span className="bg-brand-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="w-8 h-8 flex items-center justify-center rounded-full
                       text-gray-400 hover:text-white hover:bg-surface-border
                       transition-colors duration-150"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
              <ShoppingBag size={48} className="text-surface-border" />
              <p className="text-gray-500 text-sm">
                Your cart is empty.
                <br />
                Add some delicious suya to get started!
              </p>
            </div>
          ) : (
            state.items.map((item) => (
              <div
                key={item.mealId}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-dark border border-surface-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {item.mealName}
                  </p>
                  <p className="text-brand-gold text-sm font-semibold mt-0.5">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {formatCurrency(item.unitPrice)} each
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeItem(item.mealId)}
                    aria-label={`Remove ${item.mealName}`}
                    className="text-gray-600 hover:text-brand-red transition-colors duration-150"
                  >
                    <Trash2 size={14} />
                  </button>
                  <QuantitySelector
                    quantity={item.quantity}
                    onDecrease={() => setQuantity(item.mealId, item.quantity - 1)}
                    onIncrease={() => setQuantity(item.mealId, item.quantity + 1)}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="p-4 border-t border-surface-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Subtotal</span>
              <span className="text-white font-bold text-lg">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <p className="text-gray-500 text-xs">
              Delivery fee calculated at checkout
            </p>
            <button
              onClick={handleProceed}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Choose Date & Delivery
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
