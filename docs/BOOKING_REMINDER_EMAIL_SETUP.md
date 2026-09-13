# Booking Reminder Email - Implementation Guide

## Overview
Automatic reminder emails are sent to customers 30 minutes after creating a PENDING booking. The system tracks which bookings have received reminders via the `reminderEmailSentAt` timestamp to ensure each booking receives only one reminder.

---

## 🔧 Setup & Configuration

### 1. Environment Variables
Add these to your `.env.local`:

```bash
# Cron job security token (generate a secure random string)
CRON_SECRET=your_secure_random_string_here_minimum_32_chars

# Base URL for payment links in reminder emails (used for local testing and production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # local dev
NEXT_PUBLIC_BASE_URL=https://homeofsuya.com  # production
```

### 2. Database Migration
The migration adds the `reminderEmailSentAt` column to the `bookings` table.

Run the migration:
```bash
npm run prisma:migrate
```

Or manually:
```bash
npx prisma migrate deploy
```

If you're using Prisma Studio to verify:
```bash
npx prisma studio
```

---

## 🧪 Testing Locally

### Setup Test Environment

1. **Ensure your `.env.local` has:**
   ```bash
   CRON_SECRET=test_secret_12345678901234567890
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   RESEND_API_KEY=re_test_xxxxx  # (or real key for actual email)
   CUSTOMER_EMAIL_ENABLED=true    # Enable customer emails for testing
   ```

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

### Test Flow

#### Step 1: Create a PENDING Booking
Use the booking creation endpoint to create a test booking:

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "mealId": "meal_id_here",
        "mealName": "Suya Meat",
        "quantity": 2,
        "unitPrice": 8.50,
        "selections": []
      }
    ],
    "deliveryType": "CARDIFF",
    "deliveryFee": 5.0,
    "subtotal": 17.0,
    "discount": 0,
    "total": 22.0,
    "bookingDate": "2026-09-20",
    "timeSlot": "14:00-16:00",
    "customerName": "Test Customer",
    "customerWhatsapp": "+447700123456",
    "customerEmail": "test@example.com",
    "customerAddress": "123 Test Street, Cardiff"
  }'
```

**Response will include the booking `reference`** (e.g., `SU20260913001`).

#### Step 2: Verify Booking Created
Check that your booking was created with `status: PENDING`:

```bash
# Optional: Query admin bookings to verify
curl http://localhost:3000/api/admin/bookings \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Step 3: Manually Trigger Reminder Email (Immediate Testing)

For **immediate testing** (without waiting 30 minutes), modify the booking's `createdAt` in the database:

**Using Prisma Studio:**
```bash
npx prisma studio
```
1. Go to `Booking` model
2. Find your test booking by `reference`
3. Edit `createdAt` to be > 30 minutes ago (e.g., set to 2 hours ago)
4. Save

**Or via direct SQL:**
```sql
UPDATE "bookings" 
SET "createdAt" = NOW() - INTERVAL '35 minutes'
WHERE "reference" = 'SU20260913001';
```

#### Step 4: Trigger the Cron Endpoint

Call the reminder sending endpoint with your cron secret:

```bash
curl -X POST http://localhost:3000/api/bookings/reminders/send \
  -H "X-Cron-Secret: test_secret_12345678901234567890" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Reminder sending completed",
  "total": 1,
  "sent": 1,
  "failed": 0
}
```

#### Step 5: Verify Email Sent
- Check your email inbox (if using real Resend API)
- Check Resend dashboard logs: https://resend.com/emails
- Check server logs for `[Email] Booking reminder sent successfully` message

#### Step 6: Verify Database Updated
The booking's `reminderEmailSentAt` should now be set:

**Using Prisma Studio:**
```bash
npx prisma studio
```
Navigate to the booking and verify `reminderEmailSentAt` is populated.

**Or via SQL:**
```sql
SELECT reference, status, reminderEmailSentAt FROM "bookings" 
WHERE "reference" = 'SU20260913001';
```

---

## 🔄 Production Cron Setup

### Option 1: External Cron Service (Recommended)

Use **cron-job.org** or similar service to call the endpoint every 5 minutes:

1. **Create a Cron Job:**
   - URL: `https://homeofsuya.com/api/bookings/reminders/send`
   - Method: `POST`
   - Headers: Add header `X-Cron-Secret: YOUR_PRODUCTION_CRON_SECRET`
   - Execution: Every 5 minutes

2. **Example using cron-job.org:**
   - Visit https://cron-job.org/en/
   - Create new cron job
   - URL: `https://homeofsuya.com/api/bookings/reminders/send`
   - Headers: `X-Cron-Secret: YOUR_SECRET`
   - Schedule: Every 5 minutes
   - Notifications: Set up alerts for failures

### Option 2: Vercel Crons (If Deployed on Vercel)

If your app is on Vercel, use [Vercel's built-in cron functions](https://vercel.com/docs/cron-jobs):

Create `src/app/api/cron/booking-reminders/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Verify Vercel's cron authorization
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Call your reminder endpoint
  const response = await fetch('https://homeofsuya.com/api/bookings/reminders/send', {
    method: 'POST',
    headers: {
      'X-Cron-Secret': process.env.CRON_SECRET || '',
    },
  });

  return response;
}
```

Then in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/booking-reminders",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option 3: Node.js Cron Package

If you prefer to keep cron logic within your app, use `node-cron`:

```bash
npm install node-cron
```

In your app initialization or a background service:
```typescript
import cron from 'node-cron';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await fetch('http://localhost:3000/api/bookings/reminders/send', {
    method: 'POST',
    headers: {
      'X-Cron-Secret': process.env.CRON_SECRET || '',
    },
  });
});
```

---

## 📋 Endpoint Details

### POST `/api/bookings/reminders/send`

**Purpose:** Send pending booking reminder emails

**Required Headers:**
```
X-Cron-Secret: <CRON_SECRET from .env>
Content-Type: application/json
```

**Request Body:**
```json
{}
```
(No body required)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reminder sending completed",
  "total": 5,
  "sent": 5,
  "failed": 0
}
```

**Error Response (401):**
```json
{
  "error": "Unauthorized"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to send reminders",
  "details": "error message here"
}
```

---

## 📊 Monitoring

### Check Cron Job Execution
View your email history in Resend dashboard:
- https://resend.com/emails
- Filter by subject: "Reminder: Complete your payment"

### Database Monitoring
Check how many reminders have been sent:
```sql
SELECT 
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN reminderEmailSentAt IS NOT NULL THEN 1 END) as reminders_sent,
  COUNT(CASE WHEN reminderEmailSentAt IS NULL AND status = 'PENDING' THEN 1 END) as pending_no_reminder
FROM "bookings"
WHERE status = 'PENDING';
```

### Server Logs
Look for log entries:
- `[Email] Sending booking reminder` - reminder sent
- `[Cron] Reminder sent for booking` - successful cron execution
- `[Cron] Error sending booking reminders` - errors during cron

---

## 🔐 Security Notes

1. **CRON_SECRET:** Use a strong, random string (minimum 32 characters). Rotate periodically in production.
2. **IP Whitelisting:** Consider whitelisting the cron service's IP addresses in your production environment.
3. **Rate Limiting:** The endpoint doesn't have rate limiting (trusts the secret). Consider adding if needed.
4. **Email Validation:** Invalid emails are logged but don't cause the cron to fail.

---

## 🐛 Troubleshooting

### Reminder email not sent
- ✅ Check `reminderEmailSentAt` is NULL in database
- ✅ Verify booking `status` is 'PENDING'
- ✅ Check booking was created 30+ minutes ago (or manually adjust `createdAt`)
- ✅ Verify customer email is valid
- ✅ Check RESEND_API_KEY is configured
- ✅ Review server logs for errors

### Cron job not triggering
- ✅ Verify CRON_SECRET matches in header
- ✅ Check endpoint URL is correct
- ✅ Test endpoint with curl (see Step 4 above)
- ✅ Check cron service logs for failures

### Wrong payment link in email
- ✅ Verify `NEXT_PUBLIC_BASE_URL` is set correctly
- ✅ Check payment page accepts `?ref=REFERENCE` parameter
- ✅ Test URL directly in browser

---

## 📝 Implementation Checklist

- [ ] Added `CRON_SECRET` to `.env.local`
- [ ] Added `NEXT_PUBLIC_BASE_URL` to `.env.local`
- [ ] Ran database migration (`npx prisma migrate deploy`)
- [ ] Tested locally with 30-minute delay adjustment
- [ ] Verified reminder email template renders correctly
- [ ] Set up production cron job (cron-job.org / Vercel / node-cron)
- [ ] Configured error notifications for cron failures
- [ ] Tested production cron job
- [ ] Added monitoring/alerting for failed reminders

---

## 📞 Support

For issues or questions:
1. Check server logs for error messages
2. Test endpoint directly: `curl -X POST ... -H "X-Cron-Secret: ..."`
3. Verify database schema has `reminderEmailSentAt` column
4. Check Resend API dashboard for email delivery status
