"use client";

import { useState } from "react";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { ChevronDown } from "lucide-react";

export default function CookieConsent() {
  const { showBanner, isLoaded, acceptAll, rejectAll, updatePreferences } =
    useCookieConsent();
  const [expandDetails, setExpandDetails] = useState(false);
  const [preferences, setLocalPreferences] = useState({
    analytics: false,
    marketing: false,
    preferences: false,
  });

  // Don't render until loaded (prevents hydration mismatch)
  if (!isLoaded || !showBanner) {
    return null;
  }

  const handleCustomSave = () => {
    updatePreferences(preferences);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-brand-orange to-orange-600 shadow-2xl border-t-4 border-orange-700">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Main Banner */}
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-2">
                🍪 We Use Cookies
              </h2>
              <p className="text-sm text-orange-50 leading-relaxed">
                We use cookies to improve your experience, analyze site traffic, and
                personalize content. We respect your privacy and only use cookies you consent to.
              </p>
            </div>
            <button
              onClick={rejectAll}
              className="text-xs text-white hover:text-orange-100 transition whitespace-nowrap"
              aria-label="Dismiss cookie banner"
            >
              ✕
            </button>
          </div>

          {/* Details Section */}
          {expandDetails && (
            <div className="space-y-3 bg-orange-700 bg-opacity-50 rounded-lg p-4">
              {/* Essential Cookies */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    id="cookie-essential"
                    checked={true}
                    disabled
                    className="w-4 h-4 rounded cursor-not-allowed"
                  />
                  <label htmlFor="cookie-essential" className="text-sm font-semibold text-white">
                    Essential Cookies
                  </label>
                  <span className="text-xs text-orange-100 font-medium">(Always on)</span>
                </div>
                <p className="text-xs text-orange-50 ml-6">
                  Required for site functionality, security, and your login session. Cannot be disabled.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    id="cookie-analytics"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setLocalPreferences({
                        ...preferences,
                        analytics: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="cookie-analytics" className="text-sm font-semibold text-white">
                    Analytics Cookies
                  </label>
                </div>
                <p className="text-xs text-orange-50 ml-6">
                  Help us understand how visitors interact with our site. Used by Google Analytics.
                </p>
              </div>

              {/* Marketing Cookies */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    id="cookie-marketing"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setLocalPreferences({
                        ...preferences,
                        marketing: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="cookie-marketing" className="text-sm font-semibold text-white">
                    Marketing Cookies
                  </label>
                </div>
                <p className="text-xs text-orange-50 ml-6">
                  Enable personalized ads and retargeting. Used for social media and ad networks.
                </p>
              </div>

              {/* Preferences Cookies */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    id="cookie-preferences"
                    checked={preferences.preferences}
                    onChange={(e) =>
                      setLocalPreferences({
                        ...preferences,
                        preferences: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="cookie-preferences" className="text-sm font-semibold text-white">
                    Preference Cookies
                  </label>
                </div>
                <p className="text-xs text-orange-50 ml-6">
                  Remember your preferences (language, theme) for a better experience.
                </p>
              </div>

              {/* Privacy Links */}
              <div className="text-xs text-orange-100 border-t border-orange-600 pt-3 mt-3">
                <a
                  href="/privacy-policy"
                  className="hover:text-white transition font-semibold"
                >
                  Privacy Policy
                </a>
                {" • "}
                <a
                  href="/cookie-policy"
                  className="hover:text-white transition font-semibold"
                >
                  Cookie Policy
                </a>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <button
              onClick={() => setExpandDetails(!expandDetails)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-orange-600 bg-white hover:bg-orange-50 rounded-lg transition"
            >
              {expandDetails ? "Hide" : "Customize"} Cookie Settings
              <ChevronDown
                size={16}
                className={`transition-transform ${expandDetails ? "rotate-180" : ""}`}
              />
            </button>

            <div className="flex gap-2">
              <button
                onClick={rejectAll}
                className="px-4 py-2 text-sm font-semibold text-orange-600 bg-white hover:bg-orange-50 rounded-lg transition"
              >
                Reject All
              </button>

              {expandDetails ? (
                <button
                  onClick={handleCustomSave}
                  className="px-6 py-2 text-sm font-bold text-white bg-orange-900 hover:bg-orange-950 rounded-lg transition"
                >
                  Save Preferences
                </button>
              ) : (
                <button
                  onClick={acceptAll}
                  className="px-6 py-2 text-sm font-bold text-white bg-orange-900 hover:bg-orange-950 rounded-lg transition"
                >
                  Accept All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
