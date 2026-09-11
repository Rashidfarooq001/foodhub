const {PrismaClient} = require("/root/zayka-backend/node_modules/.pnpm/node_modules/@prisma/client");
const p = new PrismaClient();
p.user.updateMany({
  where: { role: "SUPER_ADMIN" },
  data: { phone: "+917006298795" }
}).then(res => {
  console.log("Updated admin phone:", res);
  p.$disconnect();
});
