"use client";

import { MapPin, Truck, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DeliveryType } from "@/types";

interface DeliveryOption {
  type: DeliveryType;
  label: string;
  description: string;
  fee: number;
  icon: React.ReactNode;
  available: boolean;
}

interface DeliverySelectorProps {
  selected: DeliveryType | null;
  onSelect: (type: DeliveryType) => void;
  cardiffFee: number;
  postageFee: number;
  postageAvailable: boolean;
}

export function DeliverySelector({
  selected,
  onSelect,
  cardiffFee,
  postageFee,
  postageAvailable,
}: DeliverySelectorProps) {
  const options: DeliveryOption[] = [
    {
      type: "PICKUP",
      label: "Pickup",
      description: "Collect in person — location details sent on confirmation",
      fee: 0,
      icon: <MapPin size={20} />,
      available: true,
    },
    {
      type: "CARDIFF",
      label: "Cardiff Delivery",
      description: "Delivered to your door within Cardiff",
      fee: cardiffFee,
      icon: <Truck size={20} />,
      available: true,
    },
    {
      type: "POSTAGE",
      label: "UK Postage",
      description: "Sent via Royal Mail — UK mainland only",
      fee: postageFee,
      icon: <Package size={20} />,
      available: postageAvailable,
    },
  ];

  return (
    <div className="space-y-3 max-w-xl">
      {options.map((opt) => {
        const isSelected = selected === opt.type;
        return (
          <button
            key={opt.type}
            onClick={() => opt.available && onSelect(opt.type)}
            disabled={!opt.available}
            className={[
              "w-full flex items-center gap-4 p-4 rounded-xl border text-left",
              "transition-all duration-150",
              !opt.available
                ? "opacity-40 cursor-not-allowed border-surface-border bg-surface-dark"
                : isSelected
                ? "border-brand-red bg-brand-red/10 ring-1 ring-brand-red"
                : "border-surface-border bg-surface-dark hover:border-brand-red/40 cursor-pointer",
            ].join(" ")}
          >
            {/* Icon */}
            <div
              className={`shrink-0 ${
                isSelected ? "text-brand-red" : "text-brand-gold"
              }`}
            >
              {opt.icon}
            </div>

            {/* Label + description */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">
                {opt.label}
                {!opt.available && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Unavailable)
                  </span>
                )}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">{opt.description}</p>
            </div>

            {/* Fee */}
            <div className="shrink-0 text-right">
              <span
                className={`font-bold text-sm ${
                  isSelected ? "text-brand-gold" : "text-gray-300"
                }`}
              >
                {opt.fee === 0 ? "Free" : `+ ${formatCurrency(opt.fee)}`}
              </span>
            </div>

            {/* Selection indicator */}
            <div
              className={[
                "w-4 h-4 rounded-full border-2 shrink-0 transition-all",
                isSelected
                  ? "border-brand-red bg-brand-red"
                  : "border-gray-600",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
