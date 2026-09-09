/**
 * Cookie Management Utilities
 *
 * Manages user cookie preferences and consent state.
 * Supports: essential, analytics, marketing, and preferences cookies.
 */

export interface CookiePreferences {
  essential: boolean; // Always true - required for site functionality
  analytics: boolean; // Google Analytics, Mixpanel
  marketing: boolean; // Ads, retargeting, tracking
  preferences: boolean; // User experience improvements
  timestamp: number; // When preference was set
  version: string; // Cookie policy version
}

const COOKIE_CONSENT_KEY = "cookie_preferences";
const COOKIE_CONSENT_SHOWN_KEY = "cookie_banner_shown";
const CURRENT_VERSION = "1.0";

/**
 * Check if cookies have been configured by this user before
 */
export function hasCookieConsent(): boolean {
  if (typeof window === "undefined") return false;

  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  return stored !== null;
}

/**
 * Check if cookie banner should be shown to user
 * Returns true if user hasn't seen/dismissed the banner yet
 */
export function shouldShowCookieBanner(): boolean {
  if (typeof window === "undefined") return false;

  const hasConsent = hasCookieConsent();
  const bannerShown = localStorage.getItem(COOKIE_CONSENT_SHOWN_KEY);

  // Show banner if:
  // 1. User hasn't given consent yet, OR
  // 2. User has given consent but we haven't shown them the banner in this session
  return !hasConsent || !bannerShown;
}

/**
 * Get current cookie preferences (or defaults)
 */
export function getCookiePreferences(): CookiePreferences {
  if (typeof window === "undefined") {
    return getDefaultPreferences();
  }

  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);

  if (!stored) {
    return getDefaultPreferences();
  }

  try {
    const prefs = JSON.parse(stored) as CookiePreferences;
    return prefs;
  } catch {
    return getDefaultPreferences();
  }
}

/**
 * Get default cookie preferences (all rejected except essential)
 */
export function getDefaultPreferences(): CookiePreferences {
  return {
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false,
    timestamp: Date.now(),
    version: CURRENT_VERSION,
  };
}

/**
 * Save cookie preferences and set tracking cookies
 */
export function setCookiePreferences(prefs: Partial<CookiePreferences>): void {
  if (typeof window === "undefined") return;

  const current = getCookiePreferences();
  const updated: CookiePreferences = {
    ...current,
    ...prefs,
    essential: true, // Always true
    timestamp: Date.now(),
    version: CURRENT_VERSION,
  };

  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(updated));
  localStorage.setItem(COOKIE_CONSENT_SHOWN_KEY, "true");

  // Initialize tracking based on preferences
  initializeTracking(updated);

  // Dispatch event for other components to listen to
  window.dispatchEvent(
    new CustomEvent("cookiePreferencesChanged", { detail: updated })
  );
}

/**
 * Accept all cookies
 */
export function acceptAllCookies(): void {
  setCookiePreferences({
    essential: true,
    analytics: true,
    marketing: true,
    preferences: true,
  });
}

/**
 * Reject all non-essential cookies
 */
export function rejectAllCookies(): void {
  setCookiePreferences({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });
}

/**
 * Check if specific cookie type is enabled
 */
export function isCookieTypeEnabled(type: keyof Omit<CookiePreferences, "timestamp" | "version">): boolean {
  const prefs = getCookiePreferences();
  return prefs[type] ?? false;
}

/**
 * Initialize tracking based on cookie preferences
 * This integrates with Google Analytics, Mixpanel, etc.
 */
function initializeTracking(prefs: CookiePreferences): void {
  if (typeof window === "undefined") return;

  const win = window as any;

  // Google Analytics
  if (prefs.analytics && typeof win.gtag !== "undefined") {
    win.gtag?.("consent", "update", {
      analytics_storage: "granted",
    });
  }

  // Mixpanel or other analytics
  if (prefs.analytics && typeof win.mixpanel !== "undefined") {
    win.mixpanel?.opt_in_tracking?.();
  }

  // Marketing cookies (Facebook Pixel, etc.)
  if (prefs.marketing && typeof win.fbq !== "undefined") {
    win.fbq?.("consent", "grant");
  }

  // User preference tracking (e.g., for dark mode, language)
  if (prefs.preferences) {
    // Initialize preference tracking
    console.log("✓ User preference tracking enabled");
  }
}

/**
 * Set a tracking cookie (respects user preferences)
 * Only sets if appropriate cookie type is enabled
 */
export function setTrackingCookie(
  name: string,
  value: string,
  cookieType: "analytics" | "marketing" | "preferences" = "analytics",
  options: { maxAge?: number; path?: string; sameSite?: string } = {}
): void {
  if (typeof document === "undefined") return;

  const prefs = getCookiePreferences();

  // Check if this cookie type is enabled
  if (!prefs[cookieType]) {
    console.warn(`Cookie type "${cookieType}" is disabled by user`);
    return;
  }

  const cookieOptions = {
    maxAge: options.maxAge || 365 * 24 * 60 * 60, // 1 year default
    path: options.path || "/",
    sameSite: options.sameSite || "Lax",
  };

  const cookieString =
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}` +
    `; Max-Age=${cookieOptions.maxAge}` +
    `; Path=${cookieOptions.path}` +
    `; SameSite=${cookieOptions.sameSite}`;

  document.cookie = cookieString;
}

/**
 * Delete a tracking cookie
 */
export function deleteTrackingCookie(name: string): void {
  if (typeof document === "undefined") return;

  document.cookie = `${encodeURIComponent(name)}=; Max-Age=-1; Path=/`;
}

/**
 * Get a specific cookie value
 */
export function getTrackingCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const nameEQ = encodeURIComponent(name) + "=";
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Clear all non-essential cookies
 */
export function clearNonEssentialCookies(): void {
  if (typeof document === "undefined") return;

  const cookies = document.cookie.split(";");
  const essentialCookies = [
    "admin_session", // NextAuth session
    "NEXT_LOCALE", // Language preference
  ];

  for (let cookie of cookies) {
    const name = cookie.split("=")[0].trim();
    if (!essentialCookies.includes(name)) {
      deleteTrackingCookie(name);
    }
  }
}

/**
 * Export user's cookie preferences (GDPR - Right to Access)
 */
export function exportCookiePreferences(): string {
  const prefs = getCookiePreferences();
  return JSON.stringify(prefs, null, 2);
}

/**
 * Delete all cookie preferences (GDPR - Right to Erasure)
 */
export function deleteCookiePreferences(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(COOKIE_CONSENT_KEY);
  localStorage.removeItem(COOKIE_CONSENT_SHOWN_KEY);
  clearNonEssentialCookies();

  window.dispatchEvent(
    new CustomEvent("cookiePreferencesDeleted")
  );
}
