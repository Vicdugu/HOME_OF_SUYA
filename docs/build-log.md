# Build Log

A chronological record of every build step for this system.

---

## Phase 1 — Scaffold, Tailwind, Prisma, DB Layer
**Completed: 2026-07-08**

- Initialised Next.js 14.2 (TypeScript, App Router, `src/` dir)
- Configured Tailwind CSS v3 with brand colours (black `#0A0A0A`, red `#C41E3A`, gold `#D4AF37`)
- Built `globals.css` with dark base styles, `.btn-primary`, `.btn-gold`, `.card` component classes
- Wrote full Prisma schema: `Meal`, `Booking`, `BookingItem`, `DeliverySettings`, `BlockedDate`, `PromoCode`, `AdminUser`
- Created `src/lib/prisma.ts` singleton, `auth.ts` (NextAuth credentials), `whatsapp.ts`, `email.ts` (off by default), `utils.ts`
- Added `src/middleware.ts` for admin route protection
- Created `prisma/seed.ts` (admin user + delivery settings)
- All TypeScript compiled with zero errors; Prisma schema validated
- Fixed: renamed `next.config.ts` → `next.config.mjs` (Next.js 14 does not support `.ts` config)
- Fixed: removed `"type": "module"` from `package.json` (conflicted with PostCSS CJS config)
- Fixed: downgraded Tailwind v4 → v3 (v4 syntax incompatible with existing config)

---

## Phase 4 — Checkout + Customer Details
**Completed: 2026-07-08**

- Extended `CartContext` — added `customerName`, `customerWhatsapp`, `customerEmail`, `customerAddress`, `customerNotes` to state; added `SET_CUSTOMER_DETAILS` action and `setCustomerDetails` callback
- Created `POST /api/promo/validate` — validates promo code against order subtotal (mock codes: `SUYA10` 10%, `WELCOME5` £5 off £15+ orders)
- Created `src/components/booking/PromoCodeInput.tsx` — apply/remove promo code with live API feedback
- Created `src/components/ui/FormField.tsx` — reusable labelled input wrapper + shared `inputCls()` helper
- Created `src/app/checkout/page.tsx` — Step 3 of 4; contact form (name, WhatsApp, email), conditional delivery address (shown for Cardiff/Postage), notes, promo code, order summary sidebar, client-side validation, saves to cart state on submit
- Guards: redirects to `/` if cart empty; redirects to `/book` if date/slot/delivery not set
- Production build: ✅ 10 pages, 0 errors

---

## Phase 3 — Booking Form (Date, Time Slot, Delivery)
**Completed: 2026-07-08**

- Created `src/lib/availability.ts` — client-safe utilities: `isBookableDay`, `isTooSoon`, `toDateString`, `fromDateString`, `getCalendarDays`, `formatBookingDate`, `formatTimeSlot`, `getAvailableDates`, `TIME_SLOTS` constant
- Added `MOCK_BLOCKED_DATES` and `MOCK_DELIVERY_SETTINGS` to `src/lib/mock-data.ts`
- Created `GET /api/availability` — returns next 10 weeks of Tue/Fri dates minus blocked
- Created `GET /api/delivery-settings` — returns Cardiff fee, postage fee, availability toggle
- Created `src/components/booking/DatePicker.tsx` — custom calendar grid, Tue/Fri selectable, past/blocked disabled
- Created `src/components/booking/TimeSlotPicker.tsx` — 4 time slot buttons (12–14, 14–16, 16–18, 18–20)
- Created `src/components/booking/DeliverySelector.tsx` — Pickup / Cardiff / UK Postage cards with fees and availability toggle
- Created `src/components/booking/BookingOrderSummary.tsx` — sticky sidebar showing items, fees, total, selected date/slot/delivery
- Created `src/app/book/page.tsx` — step-by-step progressive reveal (date → slot → delivery), redirects to / if cart empty
- Production build: ✅ 8 pages, 0 errors

---

## Phase 2 — Public Menu Page, Meal Cards, Cart State
**Completed: 2026-07-08**

- Created `src/context/CartContext.tsx` — React context + `useReducer` cart with actions: ADD_ITEM, REMOVE_ITEM, SET_QUANTITY, SET_DELIVERY, SET_DATE, SET_TIME_SLOT, SET_PROMO, CLEAR_CART
- Created `src/components/ui/QuantitySelector.tsx` — +/- quantity control
- Created `src/components/booking/MealCard.tsx` — meal image, name, description, price, inline quantity selector, sold-out state
- Created `src/components/booking/CartDrawer.tsx` — slide-in drawer, item list, remove, quantity adjust, subtotal, proceed CTA
- Created `src/components/booking/FloatingCartButton.tsx` — sticky bottom bar showing item count + subtotal, hidden when cart empty
- Created `src/app/api/meals/route.ts` — GET /api/meals (returns mock data; will switch to DB in Phase 3 DB step)
- Created `src/lib/mock-data.ts` — 6 sample suya meals for UI development before DB is connected
- Updated `src/app/page.tsx` — full menu page: hero banner, "how it works" steps, responsive meal grid, unavailable section
- Updated `src/app/layout.tsx` — wrapped with `CartProvider`
- Installed `lucide-react` for icons
- Production build: ✅ 0 errors, / route 12.3 kB

---

## Admin Account Creation — Manual Dashboard Signup
**Completed: 2026-07-15**

- Replaced the dashboard invite-only admin creation flow with direct account creation from `src/app/admin/accounts/page.tsx`
- Added form fields for `fullName`, `username`, `email`, `password`, `role`, and `status`
- Added `POST /api/admin/accounts` to create a login-ready admin record immediately with a hashed password
- Extended admin account storage to support `fullName`, `role`, and `status`
- Added idempotent SQL column backfill in `src/lib/admin-queries.ts` so the feature works without waiting for Prisma client regeneration
- Updated login to accept either username or email and to block disabled accounts
- Production build validation required after these changes

---

## Phases 5-12 — Payments, Notifications, Tracking, Admin, Polish, Deployment
**Completed: 2026-07-08 to 2026-07-15**

- Phase 5: built booking creation, SumUp checkout, Stripe fallback checkout, payment status routes, and Stripe/SumUp webhooks
- Phase 6: wired WhatsApp notifications and ensured notification failures do not break payment confirmation
- Phase 7: added booking confirmation and public order tracking pages
- Phases 8-10: built admin dashboard, meals CRUD, bookings management, CSV export, promo code manager, delivery settings, and blocked dates management
- Phase 11: added error handling pages, not-found page, and mobile admin layout improvements
- Phase 12: added deployment assets including `.env.example`, `vercel.json`, and deployment documentation
- Replaced the original NextAuth-based admin approach with custom JWT cookie auth using `jose`
- Switched public menu, availability, delivery settings, and promo validation flows from mock data to the live Neon/Postgres database

---

## Admin Auth Stabilisation
**Completed: 2026-07-15**

- Fixed local admin login persistence by adjusting the auth cookie to respect the actual request protocol during local HTTP testing
- Updated the login screen to work with either username or email
- Corrected the admin layout so `/admin/login` renders as a public auth page instead of inside the protected dashboard shell
- Verified end-to-end admin auth flow locally across dashboard, meals, bookings, and accounts pages
- Verified direct dashboard account creation using an authenticated session and successful cleanup of the temporary test account
