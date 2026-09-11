"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getCalendarDays,
  isBookableDay,
  isTooSoon,
  toDateString,
  getEarliestSelectableDate,
} from "@/lib/availability";
import type { DeliveryType } from "@/types";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_HEADERS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

interface DatePickerProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  availableDates?: string[];
  deliveryType?: DeliveryType | null;
}

export function DatePicker({ selectedDate, onSelect, availableDates = [], deliveryType = null }: DatePickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const days = getCalendarDays(viewYear, viewMonth);
  const availableSet = new Set(availableDates);
  
  // Get the earliest selectable date based on delivery type and current time
  const earliestSelectableDate = getEarliestSelectableDate(deliveryType);

  const canGoPrev =
    viewYear > today.getFullYear() || viewMonth > today.getMonth();

  const prevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  return (
    <div className="card p-4 w-full max-w-sm">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className="w-8 h-8 flex items-center justify-center rounded-full
                     hover:bg-surface-border disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors"
        >
          <ChevronLeft size={18} className="text-white" />
        </button>

        <span className="text-white font-semibold text-sm">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          onClick={nextMonth}
          aria-label="Next month"
          className="w-8 h-8 flex items-center justify-center rounded-full
                     hover:bg-surface-border transition-colors"
        >
          <ChevronRight size={18} className="text-white" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="text-center text-gray-600 text-xs font-medium py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} />;

          const dateStr = toDateString(date);
          const isSelected = selectedDate === dateStr;
          const isBookable = isBookableDay(date);
          const isTooEarly = date < earliestSelectableDate;
          const isAvailable = availableSet.has(dateStr);
          const isBlocked = isBookable && !isTooEarly && !isAvailable;
          const isSelectable = isBookable && !isTooEarly && isAvailable;

          return (
            <div key={dateStr} className="flex items-center justify-center py-0.5">
              <button
                onClick={() => isSelectable && onSelect(dateStr)}
                disabled={!isSelectable}
                title={
                  isTooEarly
                    ? deliveryType === "POSTAGE"
                      ? "Postage orders require 24-hour processing time"
                      : "Same-day orders closed after 2:00 PM — select a later date or choose Pickup/Delivery before 2:00 PM"
                    : isBlocked
                    ? "Not available"
                    : !isBookable
                    ? "Bookings on Tue & Thu only"
                    : undefined
                }
                className={[
                  "w-9 h-9 flex items-center justify-center rounded-full text-sm transition-all duration-150",
                  isSelected
                    ? "bg-brand-red text-white font-bold shadow-lg shadow-brand-red/30"
                    : isSelectable
                    ? "text-white font-semibold hover:bg-brand-red/20 hover:text-brand-gold cursor-pointer"
                    : isBlocked || isTooEarly
                    ? "text-gray-600 line-through cursor-not-allowed"
                    : "text-gray-700 cursor-default",
                ].join(" ")}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-gray-600 text-xs mt-3 text-center">
        Available{" "}
        <span className="text-brand-gold font-medium">Monday to Saturday</span>
      </p>
    </div>
  );
}
