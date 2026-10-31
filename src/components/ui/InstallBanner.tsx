"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "install-banner-dismissed-at";
const DISMISS_DAYS = 7;

export default function InstallBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const mobile = iOS || /Android/i.test(ua);

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    const recentlyDismissed = Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;

    setIsIOS(iOS);
    setVisible(mobile && !standalone && !recentlyDismissed);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || pathname === "/payment" || pathname === "/install") {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Install Home of Suya"
      className="bg-brand-red text-white px-4 py-3 flex items-center gap-3 text-sm"
    >
      <p className="flex-1 leading-snug">
        {isIOS ? (
          <>
            Add Home of Suya to your home screen: tap <strong>Share</strong> then{" "}
            <strong>Add to Home Screen</strong>.
          </>
        ) : deferredPrompt ? (
          <>Install the Home of Suya app for quicker ordering.</>
        ) : (
          <>
            Add Home of Suya to your home screen: open the <strong>⋮</strong> menu and tap{" "}
            <strong>Install app</strong>.
          </>
        )}
      </p>
      {deferredPrompt && !isIOS && (
        <button
          type="button"
          onClick={install}
          className="shrink-0 rounded bg-white px-3 py-1.5 font-semibold text-brand-red"
        >
          Install
        </button>
      )}
      <a href="/install" className="shrink-0 underline font-medium">
        Steps
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install banner"
        className="shrink-0 px-1 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
