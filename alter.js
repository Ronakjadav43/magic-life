const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE daily_entries ADD COLUMN "linkedTaskIds" TEXT[] DEFAULT ARRAY[]::TEXT[];`);
    console.log("Successfully added linkedTaskIds column");
  } catch (e) {
    if (e.message.includes('already exists')) {
       console.log("Column already exists");
    } else {
       console.error(e);
    }
  }
}

main();
