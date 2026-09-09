const fs = require('fs');
const path = require('path');

const svcPath = path.join('apps', 'backend', 'src', 'modules', 'users', 'users.service.ts');
let svcCode = fs.readFileSync(svcPath, 'utf8');

svcCode = svcCode.replace(
/async findAllCustomers\(limit = 50, search = ''\) \{[\s\S]*?return \{ customers \};\s*\}/g,
`async findAllCustomers(page = 1, limit = 50, search = '', status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
        { phone: { contains: search } },
      ];
    }
    
    // Status filter is mapped to isActive for users
    if (status && status !== 'ALL') {
      if (status === 'ACTIVE') {
        where.isActive = true;
      } else if (status === 'INACTIVE') {
        where.isActive = false;
      }
    }

    const [customers, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          ...where,
        },
        include: {
          profile: true,
          customer: {
            include: {
              orders: {
                select: { id: true, totalAmount: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.user.count({
        where: {
          role: 'CUSTOMER',
          ...where,
        },
      }),
    ]);

    return { customers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }`
);

fs.writeFileSync(svcPath, svcCode);
console.log('Fixed backend users pagination');
