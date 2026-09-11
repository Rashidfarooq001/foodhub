const {PrismaClient} = require("/root/zayka-backend/node_modules/.pnpm/node_modules/@prisma/client");
const p = new PrismaClient();
p.user.findFirst({where:{role:"SUPER_ADMIN"}}).then(u => {
  console.log(u ? JSON.stringify({email:u.email,phone:u.phone}) : "Not found");
  p.$disconnect();
});
