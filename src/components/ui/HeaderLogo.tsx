"use client";

import { useEffect, useState } from "react";

type DeliverySettingsResponse = {
  logoUrl?: string | null;
};

type HeaderLogoProps = {
  size?: "default" | "customer";
};

function getRenderableLogoUrl(imageUrl: string | null | undefined) {
  const normalized = String(imageUrl ?? "").trim();

  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("/") || /^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return null;
}

export function HeaderLogo({ size = "default" }: HeaderLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/delivery-settings")
      .then((response) => response.json())
      .then((data: DeliverySettingsResponse) => {
        if (!cancelled) {
          setLogoUrl(getRenderableLogoUrl(data.logoUrl));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLogoUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sizeClassName =
    size === "customer"
      ? "h-[4.375rem] w-[6.25rem] md:h-20 md:w-30"
      : "h-14 w-20 md:h-16 md:w-24";

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/15 bg-black/20 backdrop-blur-sm ${sizeClassName}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Malam Special Suya logo"
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
          Logo
        </div>
      )}
    </div>
  );
}