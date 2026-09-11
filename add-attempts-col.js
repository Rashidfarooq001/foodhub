require("dotenv").config({ path: "/root/zayka-backend/.env" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'otps' AND column_name = 'attempts'
    `;
    console.log("Column check:", JSON.stringify(result));
    
    if (!result || result.length === 0) {
      console.log("Adding attempts column...");
      await prisma.$executeRawUnsafe("ALTER TABLE otps ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0");
      console.log("Done.");
    } else {
      console.log("Column already exists.");
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
