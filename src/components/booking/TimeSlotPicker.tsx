"use client";

import { Clock } from "lucide-react";
import { TIME_SLOTS } from "@/lib/availability";

interface SlotState {
  remaining: number;
  isAvailable: boolean;
}

interface TimeSlotPickerProps {
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
  slotStates: Record<string, SlotState>;
}

export function TimeSlotPicker({ selectedSlot, onSelect, slotStates }: TimeSlotPickerProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
      {TIME_SLOTS.map((slot) => {
        const isSelected = selectedSlot === slot.id;
        const state = slotStates[slot.id] ?? { remaining: 0, isAvailable: false };
        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => state.isAvailable && onSelect(slot.id)}
            disabled={!state.isAvailable}
            className={[
              "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border",
              "text-sm font-medium transition-all duration-150",
              isSelected
                ? "bg-brand-red border-brand-red text-white shadow-lg shadow-brand-red/20"
                : state.isAvailable
                ? "bg-surface-dark border-surface-border text-gray-300 hover:border-brand-red/50 hover:text-white cursor-pointer"
                : "bg-surface-dark border-surface-border text-gray-600 cursor-not-allowed opacity-60",
            ].join(" ")}
          >
            <Clock
              size={18}
              className={isSelected ? "text-white" : state.isAvailable ? "text-brand-gold" : "text-gray-600"}
            />
            <span className="text-xs text-center leading-snug">
              {slot.label}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-center">
              {state.isAvailable ? `${state.remaining} left` : "Sold out"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
