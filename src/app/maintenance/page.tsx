"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface DeliverySettings {
  logoUrl?: string | null;
}

export default function MaintenancePage() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch settings to get logo URL
    fetch("/api/delivery-settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-pulse text-white text-xl">Loading...</div>
      </div>
    );
  }

  const logoUrl = settings?.logoUrl || "/logo.png";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="text-center max-w-md w-full">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            <Image
              src={logoUrl}
              alt="Home of Suya"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Maintenance Text */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Maintenance in Progress
        </h1>

        <p className="text-gray-300 text-lg mb-8">
          We're currently performing scheduled maintenance to improve your experience. We'll be back online shortly.
        </p>

        {/* Status Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-2">
            <div className="relative w-3 h-3">
              <div className="absolute inset-0 bg-yellow-400 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 bg-yellow-400 rounded-full"></div>
            </div>
            <span className="text-yellow-400 font-semibold">Maintenance Mode Active</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-lg p-6 mb-8">
          <p className="text-gray-300 text-sm leading-relaxed">
            Thank you for your patience. Our team is working to ensure everything runs smoothly. 
            <br />
            <br />
            Please try again in a few moments.
          </p>
        </div>

        {/* Footer */}
        <p className="text-gray-500 text-sm">
          If you have any questions, feel free to contact us via WhatsApp.
        </p>
      </div>
    </div>
  );
}
