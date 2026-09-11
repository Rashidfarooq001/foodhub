const {PrismaClient} = require("/root/zayka-backend/node_modules/.pnpm/node_modules/@prisma/client");
const p = new PrismaClient();
p.user.findFirst({
  where: { phone: "+917006298795" }
}).then(res => {
  console.log("User:", res);
  p.$disconnect();
});
