-- CreateIndex
CREATE INDEX "admin_users_createdAt_idx" ON "admin_users"("createdAt");

-- CreateIndex
CREATE INDEX "admin_users_status_idx" ON "admin_users"("status");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_paymentStatus_idx" ON "bookings"("paymentStatus");

-- CreateIndex
CREATE INDEX "bookings_bookingDate_idx" ON "bookings"("bookingDate");

-- CreateIndex
CREATE INDEX "meal_variation_groups_mealId_idx" ON "meal_variation_groups"("mealId");

-- CreateIndex
CREATE INDEX "meal_variation_groups_sortOrder_idx" ON "meal_variation_groups"("sortOrder");

-- CreateIndex
CREATE INDEX "meals_sortOrder_idx" ON "meals"("sortOrder");

-- CreateIndex
CREATE INDEX "meals_createdAt_idx" ON "meals"("createdAt");

-- CreateIndex
CREATE INDEX "promo_codes_isActive_idx" ON "promo_codes"("isActive");

-- CreateIndex
CREATE INDEX "promo_codes_createdAt_idx" ON "promo_codes"("createdAt");
