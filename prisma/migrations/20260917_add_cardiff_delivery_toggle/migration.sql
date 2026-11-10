-- Add Cardiff delivery enable/disable toggle to delivery_settings
ALTER TABLE "delivery_settings" ADD COLUMN "cardiffDeliveryEnabled" BOOLEAN NOT NULL DEFAULT true;
