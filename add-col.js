const env = require("fs").readFileSync("/root/zayka-backend/.env","utf8");
env.split("\n").forEach(l=>{const [k,...v]=l.trim().split("="); if(k && !k.startsWith("#")) process.env[k]=v.join("=")});
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'otps' AND column_name = 'attempts'`;
    console.log("Column check:", JSON.stringify(result));
    if (!result || result.length === 0) {
      await prisma.$executeRawUnsafe("ALTER TABLE otps ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0");
      console.log("Column added.");
    } else {
      console.log("Column already exists.");
    }
  } catch (err) { console.error("Error:", err.message); }
  finally { await prisma.$disconnect(); }
}
main();
