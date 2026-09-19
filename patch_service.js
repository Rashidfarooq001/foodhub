const fs = require('fs');
let txt = fs.readFileSync('apps/backend/src/modules/auth/auth.service.ts', 'utf8');

// Replace the dto definition
txt = txt.replace('dto: { dob: string; favoritePerson: string },', 'dto: { identifier: string; dob: string; favoritePerson: string },');

// Replace the lookup
const oldLookup = \const adminUsers = await (this.usersService as any).prisma.user.findMany({
      where: {
        OR: [
          { role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] } },
          { phone: process.env.ADMIN_PHONE_OVERRIDE || '+910000000000' },
          { email: 'www.rashidreshi2005@gmail.com' },
          { phone: process.env.ADMIN_PHONE || '+910000000000' },
        ],
        isActive: true,
      },
    });

    let adminUser =
      adminUsers.find((u: any) => u.role === UserRole.SUPER_ADMIN || u.role === UserRole.ADMIN) ||
      adminUsers[0];\;

const newLookup = \const cleanId = (dto.identifier || '').trim();
    let adminUser = await (this.usersService as any).prisma.user.findFirst({
      where: {
        OR: [{ phone: cleanId }, { email: cleanId }],
        role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        isActive: true,
      },
    });\;

txt = txt.replace(oldLookup, newLookup);
fs.writeFileSync('apps/backend/src/modules/auth/auth.service.ts', txt);
