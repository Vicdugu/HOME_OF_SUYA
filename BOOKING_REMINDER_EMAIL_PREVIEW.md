# Booking Reminder Email - DRAFT PREVIEW

## Email Subject
```
Reminder: Complete your payment for booking {REFERENCE}
```

## Email Template (HTML)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:system-ui,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#1A1A1A;border-radius:12px;overflow:hidden;border:1px solid #2A2A2A">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#C41E3A,#8B0000);padding:24px;text-align:center">
      <h1 style="color:#D4AF37;margin:0;font-size:22px;font-weight:900;letter-spacing:-0.5px">Home of Suya</h1>
    </div>
    
    <!-- Body -->
    <div style="padding:32px 28px;color:#E0E0E0">
      <h2 style="color:#fff;margin-top:0;font-size:18px">Don't miss out on your booking!</h2>
      
      <p>Hi <strong style="color:#D4AF37">{CUSTOMER_NAME}</strong>,</p>
      
      <p>You have a pending booking with us that needs payment to be confirmed. Your reservation will only be locked in once payment is complete.</p>
      
      <!-- Booking Details -->
      <div style="background:#111827;border-radius:8px;padding:16px;margin:24px 0;border-left:4px solid #C41E3A">
        <p style="margin:8px 0;font-size:14px">
          <strong>Booking Reference:</strong><br>
          <span style="color:#D4AF37;font-size:16px;font-weight:bold">{REFERENCE}</span>
        </p>
        <p style="margin:8px 0;font-size:14px">
          <strong>Booking Date & Time:</strong><br>
          {BOOKING_DATE} — {TIME_SLOT}
        </p>
        <p style="margin:8px 0;font-size:14px">
          <strong>Delivery Type:</strong><br>
          {DELIVERY_TYPE}{ADDRESS_LINE}
        </p>
        <p style="margin:8px 0;font-size:14px">
          <strong>Amount to Pay:</strong><br>
          <span style="color:#D4AF37;font-size:16px;font-weight:bold">£{TOTAL}</span>
        </p>
      </div>
      
      <!-- Items Summary -->
      <table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin:16px 0;font-size:13px">
        <thead>
          <tr style="background:#C41E3A;color:#fff">
            <th style="padding:8px 12px;text-align:left;font-weight:bold">Item</th>
            <th style="padding:8px 12px;text-align:center;font-weight:bold">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-weight:bold">Price</th>
          </tr>
        </thead>
        <tbody>
          {ITEMS_TABLE_ROWS}
        </tbody>
      </table>
      
      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0">
        <a href="{PAYMENT_LINK}" style="background:#C41E3A;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block">Complete Payment</a>
      </div>
      
      <!-- Additional Info -->
      <p style="font-size:13px;color:#888;margin-top:24px">
        <strong>Why complete payment now?</strong><br>
        Completing your payment within the next 30 minutes ensures your booking is locked in and your delivery slot is reserved. Without payment, your booking may become available for other customers.
      </p>
      
      <p style="font-size:13px;color:#888">
        <strong>Need help?</strong><br>
        Contact us on WhatsApp or reply to this email if you have any questions about your booking.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="padding:16px 28px;border-top:1px solid #2A2A2A;text-align:center">
      <p style="color:#555;font-size:11px;margin:0">This is a reminder for your pending booking.<br>Please complete payment to confirm your reservation.</p>
    </div>
  </div>
</body>
</html>
```

---

## Implementation Details

### 1. **Email Trigger Logic**
- Sent when booking is created with status `PENDING`
- Automatic reminder after **30 minutes** of inactivity (if still PENDING)
- Sent only once per booking (tracked via `reminderEmailSentAt` timestamp)

### 2. **Database Schema Enhancement**
Would add to the `Booking` model:
```prisma
reminderEmailSentAt    DateTime?  // Tracks when reminder was sent
```

### 3. **Email Function**
New function in `src/lib/email.ts`:
```typescript
export async function sendBookingReminderEmail(
  data: BookingNotificationData,
  paymentLink: string
): Promise<boolean>
```

### 4. **Execution Methods**
**Option A: Background Job (Recommended)**
- Cron job every 5 minutes checks for PENDING bookings created 30+ minutes ago
- Only sends to bookings where `reminderEmailSentAt IS NULL`

**Option B: Real-time Hook**
- Check during booking updates/payments
- Send reminder if conditions are met

---

## Questions Before Implementation:

1. ✅ **Email template look good?** Any changes to the design/messaging?
2. 📧 **Should reminder email be enabled by default** or gated by environment variable (like `REMINDER_EMAIL_ENABLED=true`)?
3. ⏱️ **30-minute delay appropriate**, or would you prefer different timing (15, 45, 60 min)?
4. 🔄 **One reminder per booking** (current design) or multiple reminders at intervals (e.g., 30 min, 60 min)?
5. 🔗 **Payment link format?** How should users return to payment? (e.g., booking reference, direct payment link?)

---

## Placeholder Variables Used:
- `{CUSTOMER_NAME}` - Customer name from booking
- `{REFERENCE}` - Booking reference number
- `{BOOKING_DATE}` - Formatted booking date
- `{TIME_SLOT}` - Time slot (e.g., "2:00 PM – 4:00 PM")
- `{DELIVERY_TYPE}` - PICKUP, CARDIFF, or POSTAGE
- `{ADDRESS_LINE}` - Customer address (if applicable)
- `{TOTAL}` - Total amount to pay
- `{ITEMS_TABLE_ROWS}` - HTML table rows with meal items
- `{PAYMENT_LINK}` - Link to payment/booking page
