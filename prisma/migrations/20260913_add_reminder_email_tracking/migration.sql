-- Add reminderEmailSentAt column to track when booking reminder emails are sent
ALTER TABLE "bookings" ADD COLUMN "reminderEmailSentAt" TIMESTAMP(3);
