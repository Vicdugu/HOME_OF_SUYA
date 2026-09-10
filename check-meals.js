const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const meals = await prisma.meal.findMany({
    select: { name: true, imageUrl: true },
    take: 10
  });
  console.log(JSON.stringify(meals, null, 2));
  await prisma.$disconnect();
}

main();
