# Architecture

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14.2 (App Router, TypeScript) |
| Styling | Tailwind CSS v3 — black/red/gold theme |
| ORM | Prisma v7 |
| Database | PostgreSQL via Neon.tech (serverless) |
| Auth | NextAuth.js v4 — credentials provider |
| Images | Cloudinary |
| Payment (primary) | SumUp Payment Links |
| Payment (fallback) | Stripe Checkout |
| WhatsApp | Meta WhatsApp Cloud API |
| Email | Resend (admin only; customer email off by default) |
| Deployment | Vercel (primary) or Netlify |

---

## Folder Structure

```
src/
├── app/
│   ├── page.tsx              ← Public menu (Phase 2)
│   ├── book/                 ← Booking form (Phase 3)
│   ├── checkout/             ← Customer details (Phase 4)
│   ├── payment/              ← Payment (Phase 5)
│   ├── confirmation/[id]/    ← Confirmation (Phase 7)
│   ├── track/[id]/           ← Order tracker (Phase 7)
│   ├── admin/                ← Admin dashboard (Phase 8-10)
│   └── api/                  ← All API routes
├── components/
│   ├── ui/                   ← Shared UI (QuantitySelector, etc.)
│   └── booking/              ← Booking flow (MealCard, CartDrawer, etc.)
├── context/
│   └── CartContext.tsx       ← Cart state (Phase 2)
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── whatsapp.ts
│   ├── email.ts
│   └── utils.ts
├── middleware.ts              ← Admin route protection
└── types/index.ts
prisma/
├── schema.prisma
└── seed.ts
docs/                         ← This documentation folder
```

---

## Database Schema

See `prisma/schema.prisma` for the full Prisma schema.

| Table | Purpose |
|---|---|
| `meals` | Admin-managed menu items |
| `bookings` | Customer bookings (all details) |
| `booking_items` | Line items per booking |
| `delivery_settings` | Cardiff fee, postage fee, toggle |
| `blocked_dates` | Dates admin has disabled |
| `promo_codes` | Discount codes (% or £) |
| `admin_users` | Admin login credentials |
