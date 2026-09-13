"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface DeliverySettings {
  isMaintenanceMode?: boolean;
}

export function MaintenanceModechecker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Skip check for admin and maintenance pages
    if (pathname?.startsWith("/admin") || pathname === "/maintenance") {
      return;
    }

    const checkMaintenance = async () => {
      try {
        const response = await fetch("/api/delivery-settings");
        if (response.ok) {
          const settings: DeliverySettings = await response.json();
          if (settings.isMaintenanceMode === true && pathname !== "/maintenance") {
            router.push("/maintenance");
          }
        }
      } catch (error) {
        console.error("Failed to check maintenance status:", error);
      }
    };

    checkMaintenance();
  }, [pathname, router]);

  return <>{children}</>;
}
