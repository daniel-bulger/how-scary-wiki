import { PrismaClient } from '@prisma/client';
import { STANDARD_DIMENSIONS } from '../src/types';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding standard scary dimensions...');
  
  for (const dimension of STANDARD_DIMENSIONS) {
    await prisma.scaryDimension.upsert({
      where: { id: dimension.id },
      update: {},
      create: {
        id: dimension.id,
        name: dimension.name,
        description: dimension.description,
        isStandard: true,
      },
    });
  }
  
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });