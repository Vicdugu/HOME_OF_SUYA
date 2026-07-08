/**
 * Seed script — run with: npx ts-node --project tsconfig.json prisma/seed.ts
 * Or via:  npm run db:seed  (after adding the script to package.json)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ log: ["error"] });

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Admin user
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123";
  const hash = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash: hash },
    create: { username, passwordHash: hash },
  });
  console.log(`✅ Admin user: ${username}`);

  // 2. Delivery settings (single row)
  const existingSettings = await prisma.deliverySettings.findFirst();
  if (!existingSettings) {
    await prisma.deliverySettings.create({
      data: {
        cardiffFee: 5.0,
        postageFee: 8.0,
        postageAvailable: true,
        minOrderCardiff: 0,
        minOrderPostage: 0,
      },
    });
    console.log("✅ Default delivery settings created");
  }

  // 3. Sample meals
  const meals = [
    {
      name: "Suya Chicken",
      description:
        "Tender chicken skewers marinated in our signature suya spice blend, grilled to perfection.",
      price: 12.0,
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      sortOrder: 1,
    },
    {
      name: "Suya Beef",
      description:
        "Premium beef cuts seasoned with authentic West African spices and slow-grilled over charcoal.",
      price: 14.0,
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      sortOrder: 2,
    },
    {
      name: "Mixed Suya Platter",
      description:
        "A generous mix of chicken and beef suya with fresh salad, tomatoes, onions, and extra spice.",
      price: 18.0,
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      sortOrder: 3,
    },
  ];

  for (const meal of meals) {
    const existing = await prisma.meal.findFirst({
      where: { name: meal.name },
    });
    if (!existing) {
      await prisma.meal.create({ data: meal });
      console.log(`✅ Meal: ${meal.name}`);
    }
  }

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
