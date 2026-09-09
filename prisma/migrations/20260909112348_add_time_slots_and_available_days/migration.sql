/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `admin_users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[verificationToken]` on the table `admin_users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resetToken]` on the table `admin_users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "VariationSelectionType" AS ENUM ('SINGLE', 'MULTIPLE');

-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "email" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'ADMIN',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpiry" TIMESTAMP(3),
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "delivery_settings" ADD COLUMN     "availableDays" JSONB DEFAULT '[1,2,3,4,5,6]',
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "timeSlots" JSONB DEFAULT '[{"id":"14:00-16:00","label":"2:00 PM – 4:00 PM"},{"id":"18:00-20:00","label":"6:00 PM – 8:00 PM"}]';

-- CreateTable
CREATE TABLE "meal_variation_groups" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "selectionType" "VariationSelectionType" NOT NULL DEFAULT 'SINGLE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_variation_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_variation_options" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_variation_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_verificationToken_key" ON "admin_users"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_resetToken_key" ON "admin_users"("resetToken");

-- AddForeignKey
ALTER TABLE "meal_variation_groups" ADD CONSTRAINT "meal_variation_groups_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_variation_options" ADD CONSTRAINT "meal_variation_options_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "meal_variation_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
