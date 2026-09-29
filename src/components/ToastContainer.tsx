"use client";

import React from "react";
import { Toast } from "@/components/Toast";
import { useCart } from "@/context/CartContext";

export function ToastContainer() {
  const { toastMessage, clearToast } = useCart();

  if (!toastMessage) return null;

  return <Toast message={toastMessage} duration={2000} onClose={clearToast} />;
}
