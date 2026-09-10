const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const meals = await prisma.meal.findMany({
    select: { id: true, name: true, imageUrl: true, createdAt: true }
  });
  console.log('Total meals:', meals.length);
  console.log(JSON.stringify(meals, null, 2));
  await prisma.$disconnect();
}
main();
