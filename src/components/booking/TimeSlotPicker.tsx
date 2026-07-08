"use client";

import { Clock } from "lucide-react";
import { TIME_SLOTS } from "@/lib/availability";

interface TimeSlotPickerProps {
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
}

export function TimeSlotPicker({ selectedSlot, onSelect }: TimeSlotPickerProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
      {TIME_SLOTS.map((slot) => {
        const isSelected = selectedSlot === slot.id;
        return (
          <button
            key={slot.id}
            onClick={() => onSelect(slot.id)}
            className={[
              "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border",
              "text-sm font-medium transition-all duration-150 cursor-pointer",
              isSelected
                ? "bg-brand-red border-brand-red text-white shadow-lg shadow-brand-red/20"
                : "bg-surface-dark border-surface-border text-gray-300 hover:border-brand-red/50 hover:text-white",
            ].join(" ")}
          >
            <Clock
              size={18}
              className={isSelected ? "text-white" : "text-brand-gold"}
            />
            <span className="text-xs text-center leading-snug">
              {slot.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
