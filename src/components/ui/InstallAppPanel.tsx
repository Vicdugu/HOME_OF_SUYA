"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallAppPanel() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1));

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <p className="text-center text-lg font-semibold text-gray-800">
        Home of Suya is already installed on this device. Open it from your home screen.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {deferredPrompt && (
        <div className="text-center">
          <button
            type="button"
            onClick={handleInstallClick}
            className="inline-flex items-center rounded-lg bg-brand-red px-6 py-3 font-semibold text-white shadow hover:opacity-90"
          >
            Install Home of Suya
          </button>
        </div>
      )}

      <section aria-labelledby="install-iphone">
        <h2 id="install-iphone" className="text-xl font-semibold text-gray-900 mb-3">
          iPhone and iPad (Safari)
        </h2>
        <ol className="list-decimal space-y-2 pl-6 text-gray-700">
          <li>Open this page in Safari.</li>
          <li>Tap the Share button (the square with an up arrow).</li>
          <li>Scroll down and tap “Add to Home Screen”.</li>
          <li>Tap “Add”.</li>
        </ol>
        {isIOS && (
          <p className="mt-3 text-sm text-gray-500">You are on an iPhone or iPad, so these steps apply to you.</p>
        )}
      </section>

      <section aria-labelledby="install-android">
        <h2 id="install-android" className="text-xl font-semibold text-gray-900 mb-3">
          Android (Chrome)
        </h2>
        <ol className="list-decimal space-y-2 pl-6 text-gray-700">
          <li>Open this page in Chrome.</li>
          <li>Tap the menu (three dots) in the top-right corner.</li>
          <li>Tap “Install app” or “Add to Home screen”.</li>
          <li>Tap “Install”.</li>
        </ol>
        {!isIOS && !deferredPrompt && (
          <p className="mt-3 text-sm text-gray-500">
            If you do not see the install button above, use the steps here.
          </p>
        )}
      </section>
    </div>
  );
}
