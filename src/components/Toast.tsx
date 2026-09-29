"use client";

import React, { useEffect } from "react";
import { Check } from "lucide-react";

interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
  type?: "success" | "error" | "info";
}

export function Toast({
  message,
  duration = 2000,
  onClose,
  type = "success",
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-brand-red"
      : "bg-brand-gold";
  const icon = type === "success" ? <Check size={18} /> : null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-5 py-3.5 rounded-lg shadow-lg flex items-center gap-2.5 animate-slide-up z-50`}
      role="alert"
      aria-live="polite"
    >
      {icon}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
