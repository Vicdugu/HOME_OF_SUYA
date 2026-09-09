"use client";

import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min?: number;
  max?: number;
}

export function QuantitySelector({
  quantity,
  onDecrease,
  onIncrease,
  min = 0,
  max = 99,
}: QuantitySelectorProps) {
  return (
    <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onDecrease();
        }}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
        className="w-8 h-8 rounded-full border border-surface-border
                   flex items-center justify-center
                   text-white hover:border-brand-red hover:text-brand-red
                   disabled:opacity-30 disabled:cursor-not-allowed
                   transition-colors duration-150"
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>

      <span className="w-6 text-center text-white font-semibold text-sm tabular-nums">
        {quantity}
      </span>

      <button
        onClick={(event) => {
          event.stopPropagation();
          onIncrease();
        }}
        disabled={quantity >= max}
        aria-label="Increase quantity"
        className="w-8 h-8 rounded-full bg-brand-red
                   flex items-center justify-center
                   text-white hover:bg-brand-red-light
                   disabled:opacity-30 disabled:cursor-not-allowed
                   transition-colors duration-150"
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
