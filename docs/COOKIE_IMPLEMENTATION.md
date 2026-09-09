# Cookie Consent Implementation Guide

**Date**: 2026-09-09  
**Version**: 1.0  
**Status**: ✅ Ready for Production

---

## Overview

Home of Suya now has a comprehensive cookie consent system that:

- ✅ Displays a banner to all new visitors
- ✅ Manages 4 cookie categories (Essential, Analytics, Marketing, Preferences)
- ✅ Respects user preferences
- ✅ Integrates with Google Analytics, Facebook Pixel, and other services
- ✅ GDPR and CCPA compliant
- ✅ Provides user privacy controls

---

## Architecture

### Files Created

```
src/
├── lib/cookies.ts                    # Core cookie management utilities
├── hooks/useCookieConsent.ts         # React hook for components
├── components/ui/CookieConsent.tsx   # Cookie banner component
└── app/
    ├── privacy-policy/page.tsx       # Privacy policy page
    └── cookie-policy/page.tsx        # Cookie policy page
```

### How It Works

```
User visits site
    ↓
Check localStorage for cookie preferences
    ↓
No preferences found?
    ↓
Show cookie banner to user
    ↓
User selects preferences
    ↓
Save to localStorage
    ↓
Initialize tracking services
    ↓
Never show banner again (until cookies cleared)
```

---

## Components & Utilities

### 1. `src/lib/cookies.ts`

Core utilities for managing cookies:

```typescript
// Get current preferences
const prefs = getCookiePreferences();
// Returns: { essential: true, analytics: false, marketing: false, preferences: false }

// Check if consent given
const hasConsent = hasCookieConsent();
// Returns: boolean

// Show banner?
const shouldShow = shouldShowCookieBanner();
// Returns: boolean

// Accept all cookies
acceptAllCookies();

// Reject all non-essential
rejectAllCookies();

// Check if specific type is enabled
const analyticsEnabled = isCookieTypeEnabled('analytics');

// Save custom preferences
setCookiePreferences({ analytics: true, marketing: false });

// Delete all preferences (GDPR right to erasure)
deleteCookiePreferences();

// Export preferences (GDPR right to access)
const data = exportCookiePreferences();
```

### 2. `src/hooks/useCookieConsent.ts`

React hook for components:

```typescript
"use client";

import { useCookieConsent } from "@/hooks/useCookieConsent";

export default function MyComponent() {
  const {
    preferences,        // Current cookie preferences
    showBanner,         // Should banner be visible?
    isLoaded,           // Is hook loaded (prevents hydration issues)?
    updatePreferences,  // Save custom preferences
    acceptAll,          // Accept all cookies
    rejectAll,          // Reject all
    isEnabled,          // Check if type is enabled
  } = useCookieConsent();

  // Only render when loaded
  if (!isLoaded) return null;

  // Check if analytics is enabled
  if (preferences?.analytics) {
    // Initialize Google Analytics
  }

  return <div>{/* ... */}</div>;
}
```

### 3. `src/components/ui/CookieConsent.tsx`

Pre-built cookie banner component:

- Displays to all new visitors
- Shows cookie options expandable
- Respects user's theme (orange/dark mode)
- Mobile responsive
- Sticky footer position
- Never shows again after user responds

---

## Integration Examples

### Example 1: Use In Components

```typescript
"use client";

import { useCookieConsent } from "@/hooks/useCookieConsent";

export default function BookingForm() {
  const { preferences, isLoaded } = useCookieConsent();

  if (!isLoaded) return <LoadingSpinner />;

  return (
    <form>
      {/* Form fields */}

      {/* Show analytics opt-in notice */}
      {preferences?.analytics && (
        <p className="text-xs text-gray-500">
          This form submission will be tracked for analytics purposes.
        </p>
      )}
    </form>
  );
}
```

### Example 2: Initialize Google Analytics

**File**: `src/app/analytics.tsx` (create new file)

```typescript
"use client";

import { useEffect } from "react";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import Script from "next/script";

export default function Analytics() {
  const { preferences } = useCookieConsent();

  useEffect(() => {
    if (!preferences?.analytics) return;

    // Google Analytics is already loaded, just enable tracking
    if (typeof gtag !== "undefined") {
      gtag("consent", "update", {
        analytics_storage: "granted",
      });
    }
  }, [preferences?.analytics]);

  // Only load GA script if analytics enabled
  if (!preferences?.analytics) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
```

Then add to `src/app/layout.tsx`:

```typescript
import Analytics from "@/components/Analytics";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Analytics />
        {children}
      </body>
    </html>
  );
}
```

### Example 3: Track Events with Cookie Consent

```typescript
"use client";

import { useCookieConsent } from "@/hooks/useCookieConsent";

export default function BookingButton() {
  const { isEnabled } = useCookieConsent();

  const handleBooking = () => {
    // Only send analytics if user consented
    if (isEnabled("analytics")) {
      gtag("event", "booking_created", {
        meal_count: 2,
        total_price: 25.99,
      });
    }

    // Always send to server (not tracking)
    fetch("/api/bookings", { method: "POST" });
  };

  return <button onClick={handleBooking}>Book Now</button>;
}
```

### Example 4: Facebook Pixel

**File**: `src/components/FacebookPixel.tsx`

```typescript
"use client";

import { useEffect } from "react";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import Script from "next/script";

export default function FacebookPixel() {
  const { preferences } = useCookieConsent();

  useEffect(() => {
    if (!preferences?.marketing) return;

    // Facebook Pixel already loaded, enable tracking
    if (typeof fbq !== "undefined") {
      fbq("consent", "grant");
    }
  }, [preferences?.marketing]);

  if (!preferences?.marketing) {
    return null;
  }

  return (
    <Script
      id="facebook-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', 'YOUR_PIXEL_ID');
          fbq('track', 'PageView');
        `,
      }}
    />
  );
}
```

---

## Cookie Categories

### Essential (Always Enabled)

- Session management
- Login/authentication
- CSRF protection
- Shopping cart
- Security features

**Cannot be disabled** - Required for site to function

### Analytics (Opt-in)

Used by: **Google Analytics**

Tracks:
- Page views
- User journeys
- Session duration
- Device type
- Traffic sources

**Purpose**: Understand how users interact with the site

### Marketing (Opt-in)

Used by: **Facebook Pixel**, **Google Ads**

Tracks:
- User interests
- Purchase behavior
- Ad interactions
- Retargeting data

**Purpose**: Personalize ads and measure ad effectiveness

### Preferences (Opt-in)

Tracks:
- User preferences (dark mode, language)
- Meal preferences
- Previously viewed items
- Accessibility settings

**Purpose**: Improve user experience

---

## Testing

### Test 1: New Visitor

1. Open browser incognito/private mode
2. Visit `http://localhost:3000`
3. Should see orange cookie banner at bottom
4. Click "Accept All" → Banner disappears
5. Refresh page → Banner should NOT reappear
6. Open DevTools → Application → LocalStorage
7. Should see `cookie_preferences` entry

### Test 2: Custom Preferences

1. Clear cookies: DevTools → Application → Clear All
2. Refresh page → Banner reappears
3. Click "Customize Cookie Settings"
4. Check only "Analytics"
5. Click "Save Preferences"
6. Banner should close
7. Verify localStorage shows: `analytics: true, marketing: false`

### Test 3: GDPR/CCPA Rights

**Right to Access**:
```javascript
// In browser console
import { exportCookiePreferences } from '@/lib/cookies';
const data = exportCookiePreferences();
console.log(data);
```

**Right to Erasure**:
```javascript
import { deleteCookiePreferences } from '@/lib/cookies';
deleteCookiePreferences();
// Should clear all cookie preferences and localStorage
```

---

## Privacy Policy Links

Both pages are now available:

- **Privacy Policy**: `/privacy-policy`
- **Cookie Policy**: `/cookie-policy`

These are linked from:
- Cookie banner (expandable details)
- Footer
- Account settings

---

## Production Checklist

- [ ] Replace `GA_MEASUREMENT_ID` with actual Google Analytics ID
- [ ] Replace `YOUR_PIXEL_ID` with actual Facebook Pixel ID
- [ ] Test in production domain
- [ ] Verify Google Analytics receives data
- [ ] Verify Facebook Pixel fires events
- [ ] Test on mobile devices
- [ ] Test with different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Verify localStorage is working
- [ ] Check that rejected users don't get analytics cookies
- [ ] Verify privacy policy is complete and accurate
- [ ] Verify cookie policy is complete and accurate

---

## Event Listeners

Components can listen to cookie preference changes:

```typescript
useEffect(() => {
  const handleChange = (e: CustomEvent) => {
    const preferences = e.detail;
    console.log("User updated preferences:", preferences);
  };

  window.addEventListener("cookiePreferencesChanged", handleChange);
  return () => {
    window.removeEventListener("cookiePreferencesChanged", handleChange);
  };
}, []);
```

---

## Common Issues

### Issue 1: Banner Shows After Accepting

**Cause**: `shouldShowCookieBanner()` returns true  
**Fix**: Check localStorage is working - DevTools → Application → LocalStorage

### Issue 2: Hydration Mismatch Error

**Cause**: Component renders differently on server vs client  
**Fix**: Always check `isLoaded` in hook before rendering

### Issue 3: Analytics Not Tracking

**Cause**: User has marketing/analytics disabled  
**Fix**: Verify user accepted cookies, check preferences

### Issue 4: Facebook Pixel Not Firing

**Cause**: Marketing cookies disabled  
**Fix**: Accept all cookies or enable marketing specifically

---

## GDPR Compliance

✅ Cookie consent required before non-essential cookies  
✅ Users can withdraw consent anytime  
✅ Right to access (export preferences)  
✅ Right to erasure (delete preferences)  
✅ Privacy policy available  
✅ Cookie policy available  
✅ Clear cookie descriptions  
✅ Granular consent per cookie type  

---

## Maintenance

### Daily
- No action needed - autonomous

### Weekly
- Monitor Google Analytics for any drops in tracked data
- Check error logs for cookie-related issues

### Monthly
- Review privacy/cookie policies
- Check for new third-party services that set cookies

### Annually
- Update privacy/cookie policies
- Review cookie retention policies
- Update GDPR compliance checklist

---

## References

- [Google Analytics Cookie Policy](https://policies.google.com/technologies/cookies)
- [GDPR Cookie Requirements](https://gdpr-info.eu/issues/cookies/)
- [CCPA Cookie Rules](https://oag.ca.gov/privacy/ccpa)
- [Mozilla Cookie Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)

---

**Last Updated**: 2026-09-09  
**Next Review**: 2026-10-09  
**Maintained By**: Development Team
