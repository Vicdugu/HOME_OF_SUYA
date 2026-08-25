# Deployment Guide

## Platform: Vercel (recommended)

---

### 1. Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import the Home of Suya GitHub repository from your account
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: `/` (default)
5. Build command: `npx prisma generate && next build` ← set this manually
6. Click **Deploy** (first deploy will fail — env vars needed next)

---

### 2. Add Environment Variables in Vercel

Go to **Project → Settings → Environment Variables** and add every variable from [`.env.example`](../.env.example).

**Required for basic operation:**

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → Connection Details → Prisma tab |
| `NEXTAUTH_SECRET` | Run `openssl rand -hex 32` in terminal |
| `NEXT_PUBLIC_APP_URL` | Your Vercel domain, e.g. `https://home-of-suya.vercel.app` |
| `NEXTAUTH_URL` | Same as `NEXT_PUBLIC_APP_URL` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | A strong password (min 12 chars, mix of letters/numbers/symbols) |

**Required for payments:**

| Variable | Where to get it |
|---|---|
| `SUMUP_API_KEY` | SumUp Developer Portal |
| `SUMUP_MERCHANT_CODE` | SumUp merchant code for the receiving account |

**Optional for OAuth-style SumUp setup:**

| Variable | Where to get it |
|---|---|
| `SUMUP_CLIENT_ID` | SumUp Developer Portal → OAuth client |
| `SUMUP_CLIENT_SECRET` | SumUp Developer Portal → OAuth client |
| `SUMUP_OAUTH_REDIRECT_URI` | Fixed callback URL, e.g. `https://YOUR-DOMAIN.com/api/sumup/oauth/callback` |

**Required for WhatsApp notifications:**

| Variable | Where to get it |
|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Business Suite → WhatsApp → Getting Started |
| `WHATSAPP_ACCESS_TOKEN` | Meta Business Suite → System User token |
| `ADMIN_WHATSAPP_NUMBER` | Your WhatsApp number, e.g. `447700000000` (no + prefix) |

---

### 3. Redeploy

After adding env vars → **Deployments → Redeploy** (with latest commit).

---

### 4. Register Webhook URLs

After your domain is live:

**SumUp:**
1. SumUp Developer Portal → Your App → Webhooks
2. URL: `https://YOUR-DOMAIN.com/api/payments/webhook/sumup`

---

### 5. Run database seed on production

After first successful deploy, run seed to create the admin user and delivery settings:

```bash
# In your local terminal (with DATABASE_URL pointing to prod Neon):
npx prisma db seed
```

Or use Neon's SQL editor to verify tables exist.

---

### 6. Verify

| URL | Expected |
|---|---|
| `https://YOUR-DOMAIN.com` | Menu page with meals |
| `https://YOUR-DOMAIN.com/admin/login` | Admin login |
| `https://YOUR-DOMAIN.com/track` | Order tracker |

---

### Custom Domain (optional)

1. Vercel → Project → Settings → Domains
2. Add your domain (e.g. `homeofsuya.co.uk`)
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to the new domain
5. Redeploy

---

### Environment notes

- `.env` is gitignored — never commit real credentials
- `.env.example` is safe to commit — it has no real values
- Admin password is bcrypt-hashed in the DB — changing `.env` alone does nothing; you must re-run `prisma db seed`
