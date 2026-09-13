-- Add maintenance mode toggle to delivery_settings
ALTER TABLE "delivery_settings" ADD COLUMN "isMaintenanceMode" BOOLEAN NOT NULL DEFAULT false;
