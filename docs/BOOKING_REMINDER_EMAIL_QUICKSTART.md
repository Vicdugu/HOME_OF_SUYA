# Booking Reminder Email - Quick Start Guide

## ✅ Implementation Complete

Your booking reminder email system is ready. Here's what was implemented:

### Components Added:
1. ✅ **Database Schema** — `reminderEmailSentAt` column added to track sent reminders
2. ✅ **Email Template** — Professional HTML reminder email with booking details & payment link
3. ✅ **Cron Endpoint** — `POST /api/bookings/reminders/send` for background task execution
4. ✅ **Migration** — Applied to database (ready for production)

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Add Environment Variables
Edit your `.env.local`:

```bash
# Security token for cron job (use a strong random string)
CRON_SECRET=your_secure_random_string_min_32_chars_long

# Base URL for payment links in emails
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # local
# NEXT_PUBLIC_BASE_URL=https://homeofsuya.com  # production

# Enable customer emails (reminder emails will send if true)
CUSTOMER_EMAIL_ENABLED=true
```

### Step 2: Start Dev Server
```bash
npm run dev
```

### Step 3: Test Locally (Immediate Email)

**Create a test booking:**
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"mealId":"meal1","mealName":"Suya","quantity":2,"unitPrice":8.50,"selections":[]}],
    "deliveryType":"CARDIFF",
    "deliveryFee":5.0,
    "subtotal":17.0,
    "discount":0,
    "total":22.0,
    "bookingDate":"2026-09-20",
    "timeSlot":"14:00-16:00",
    "customerName":"Test User",
    "customerWhatsapp":"+447700000000",
    "customerEmail":"your_email@example.com",
    "customerAddress":"123 Test St"
  }'
```

**Note the `reference` in response (e.g., `SU20260913001`)**

**Adjust booking time (to skip 30-min wait):**
Using Prisma Studio:
```bash
npx prisma studio
# Go to Booking → find your test booking → edit createdAt to 35 mins ago → save
```

**Trigger the reminder email:**
```bash
curl -X POST http://localhost:3000/api/bookings/reminders/send \
  -H "X-Cron-Secret: your_secure_random_string_min_32_chars_long" \
  -H "Content-Type: application/json"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Reminder sending completed",
  "total": 1,
  "sent": 1,
  "failed": 0
}
```

**Check your email!** ✉️

---

## 🔧 How It Works

### Flow:
1. **Customer creates PENDING booking** → `POST /api/bookings`
   - Booking created with `status: PENDING`, `reminderEmailSentAt: null`

2. **After 30 minutes** → Cron job checks for reminders
   - Finds all PENDING bookings created 30+ mins ago with no reminder sent

3. **Email sent** → Includes:
   - ✓ Booking reference & details
   - ✓ Itemized order table
   - ✓ Total amount due
   - ✓ Payment link with booking reference
   - ✓ Reminder to complete payment within 30 mins

4. **Tracking** → `reminderEmailSentAt` is set to prevent duplicate emails

---

## 📋 Key Files Created/Modified

```
prisma/schema.prisma
  └─ Added: reminderEmailSentAt DateTime? field to Booking

prisma/migrations/20260913_add_reminder_email_tracking/
  └─ Migration SQL to add column to database

src/lib/email.ts
  └─ Added: sendBookingReminderEmail(data) function
  
src/app/api/bookings/reminders/send/route.ts (NEW)
  └─ POST endpoint for cron job execution
  
docs/BOOKING_REMINDER_EMAIL_SETUP.md (NEW)
  └─ Full setup & troubleshooting guide
```

---

## 🔐 Production Setup

### Option A: cron-job.org (Recommended - Easiest)
1. Visit https://cron-job.org
2. Create new cron job:
   - **URL:** `https://homeofsuya.com/api/bookings/reminders/send`
   - **Headers:** Add `X-Cron-Secret: YOUR_PRODUCTION_SECRET`
   - **Schedule:** Every 5 minutes
   - **Notifications:** Enable for failures

### Option B: Vercel Crons (If on Vercel)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/bookings/reminders/send",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option C: Node.js Cron (If self-hosted)
```bash
npm install node-cron
```

In your app initialization:
```typescript
import cron from 'node-cron';

cron.schedule('*/5 * * * *', async () => {
  await fetch('http://localhost:3000/api/bookings/reminders/send', {
    method: 'POST',
    headers: { 'X-Cron-Secret': process.env.CRON_SECRET },
  });
});
```

---

## 📊 Monitoring

### Check if reminders were sent:
```sql
SELECT reference, status, reminderEmailSentAt 
FROM "bookings" 
WHERE status = 'PENDING' AND reminderEmailSentAt IS NOT NULL;
```

### Email delivery logs:
- Visit Resend dashboard: https://resend.com/emails
- Filter by subject: "Reminder: Complete your payment"

### Server logs to watch for:
```
[Email] Sending booking reminder → reminder sent
[Cron] Reminder sent for booking → success
[Cron] Error sending booking reminders → failures
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Email not sent | ✅ Check `reminderEmailSentAt` is NULL in DB ✅ Verify booking is 30+ mins old ✅ Confirm customer email is valid |
| Cron not triggering | ✅ Verify `CRON_SECRET` matches in header ✅ Test endpoint with curl directly ✅ Check cron service logs |
| Wrong payment link | ✅ Verify `NEXT_PUBLIC_BASE_URL` is correct ✅ Test URL in browser |
| Too many/few reminders | ✅ Current design: ONE reminder per booking (by design) ✅ Adjust `REMINDER_DELAY_MINUTES` in code if needed |

---

## 📞 Need Help?

Refer to the full documentation:
📄 [docs/BOOKING_REMINDER_EMAIL_SETUP.md](./BOOKING_REMINDER_EMAIL_SETUP.md)

Full testing steps, API details, and troubleshooting guide included.

---

## ✨ Features

- ✅ Automatic reminders 30 minutes after PENDING booking
- ✅ One reminder per booking (prevents spam)
- ✅ Secure cron endpoint (CRON_SECRET protected)
- ✅ Detailed payment link with booking reference
- ✅ Professional HTML email template
- ✅ Database tracking to prevent duplicates
- ✅ Error logging & monitoring
- ✅ Production-ready deployment options

---

## 🎯 Next Steps

1. [ ] Add `CRON_SECRET` & `NEXT_PUBLIC_BASE_URL` to `.env.local`
2. [ ] Test locally following "Quick Setup" above
3. [ ] Verify email in your inbox
4. [ ] Deploy to production
5. [ ] Set up production cron job (cron-job.org / Vercel / other)
6. [ ] Monitor reminder sending via Resend dashboard & server logs

**Ready to commit & push when you are!** 🚀
