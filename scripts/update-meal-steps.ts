/**
 * Update meal variation group selection types
 * For Lamb Suya, Beef Suya, and Chicken Suya:
 * - Step 1 (Size): Change to SINGLE (Required)
 * - Step 2 (Topping): Keep as is
 * - Step 3 (Veggies): Change to MULTIPLE (Optional)
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

async function main() {
  console.log("🔄 Updating meal variation groups...\n");

  const mealNames = ["Lamb Suya", "Beef Suya", "Chicken Suya"];

  for (const mealName of mealNames) {
    const meal = await prisma.meal.findFirst({
      where: { name: mealName },
      include: { variationGroups: { orderBy: { sortOrder: "asc" } } },
    });

    if (!meal) {
      console.log(`⚠️  Meal not found: ${mealName}`);
      continue;
    }

    console.log(`📝 Updating: ${mealName}`);
    console.log(`   Found ${meal.variationGroups.length} variation groups`);

    // Update Step 1 (index 0) to SINGLE (Required)
    if (meal.variationGroups[0]) {
      await prisma.mealVariationGroup.update({
        where: { id: meal.variationGroups[0].id },
        data: { selectionType: "SINGLE" },
      });
      console.log(
        `   ✅ Step 1 (${meal.variationGroups[0].name}): Changed to SINGLE (Required)`
      );
    }

    // Step 2 (index 1) - no change
    if (meal.variationGroups[1]) {
      console.log(
        `   ℹ️  Step 2 (${meal.variationGroups[1].name}): Keeping as ${meal.variationGroups[1].selectionType}`
      );
    }

    // Update Step 3 (index 2) to MULTIPLE (Optional)
    if (meal.variationGroups[2]) {
      await prisma.mealVariationGroup.update({
        where: { id: meal.variationGroups[2].id },
        data: { selectionType: "MULTIPLE" },
      });
      console.log(
        `   ✅ Step 3 (${meal.variationGroups[2].name}): Changed to MULTIPLE (Optional)`
      );
    }

    console.log();
  }

  console.log("🎉 Update complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
