/**
 * Hook for managing cookie preferences in React components
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CookiePreferences,
  getCookiePreferences,
  setCookiePreferences,
  acceptAllCookies,
  rejectAllCookies,
  shouldShowCookieBanner,
  isCookieTypeEnabled,
} from "@/lib/cookies";

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(
    null
  );
  const [showBanner, setShowBanner] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const prefs = getCookiePreferences();
    setPreferences(prefs);
    setShowBanner(shouldShowCookieBanner());
    setIsLoaded(true);

    // Listen for changes
    const handleChange = (e: Event) => {
      const customEvent = e as CustomEvent<CookiePreferences>;
      setPreferences(customEvent.detail);
      setShowBanner(false);
    };

    window.addEventListener("cookiePreferencesChanged", handleChange);

    return () => {
      window.removeEventListener("cookiePreferencesChanged", handleChange);
    };
  }, []);

  const updatePreferences = useCallback(
    (newPrefs: Partial<CookiePreferences>) => {
      setCookiePreferences(newPrefs);
    },
    []
  );

  const handleAcceptAll = useCallback(() => {
    acceptAllCookies();
    setShowBanner(false);
  }, []);

  const handleRejectAll = useCallback(() => {
    rejectAllCookies();
    setShowBanner(false);
  }, []);

  const isEnabled = useCallback(
    (type: keyof Omit<CookiePreferences, "timestamp" | "version">) => {
      return isCookieTypeEnabled(type);
    },
    []
  );

  return {
    preferences,
    showBanner,
    isLoaded,
    updatePreferences,
    acceptAll: handleAcceptAll,
    rejectAll: handleRejectAll,
    isEnabled,
  };
}
