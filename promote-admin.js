const {PrismaClient} = require("/root/zayka-backend/node_modules/.pnpm/node_modules/@prisma/client");
const p = new PrismaClient();
async function main() {
  const admin = await p.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!admin) return console.log("No super admin found");
  
  await p.user.update({
    where: { phone: "+917006298795" },
    data: {
      role: "SUPER_ADMIN",
      password1Hash: admin.password1Hash,
      password2Hash: admin.password2Hash,
      adminDobHash: admin.adminDobHash,
      adminFavoritePersonHash: admin.adminFavoritePersonHash
    }
  });
  console.log("Successfully promoted +917006298795 to SUPER_ADMIN");
}
main().then(() => p.$disconnect());
