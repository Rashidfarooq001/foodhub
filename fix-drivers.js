const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------
// 1. Backend: drivers.service.ts
// ---------------------------------------------------------
const drvSvcPath = path.join('apps', 'backend', 'src', 'modules', 'drivers', 'drivers.service.ts');
let drvSvcCode = fs.readFileSync(drvSvcPath, 'utf8');

drvSvcCode = drvSvcCode.replace(
/async findAllDrivers\(\) \{[\s\S]*?orderBy: \{ id: 'desc' \},\s*\}\);\s*\}/g,
`async findAllDrivers(page = 1, limit = 50, search?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    if (status && status !== 'ALL') {
      if (status === 'PENDING') {
        where.isApproved = false;
        where.status = 'PENDING';
      } else if (status === 'APPROVED') {
        where.isApproved = true;
        where.status = { not: 'SUSPENDED' };
      } else if (status === 'SUSPENDED') {
        where.status = 'SUSPENDED';
      } else {
        where.status = status;
      }
    }

    if (search) {
      where.OR = [
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { user: { phone: { contains: search } } },
        { user: { profile: { firstName: { contains: search, mode: 'insensitive' } } } },
        { user: { profile: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [drivers, total] = await this.prisma.$transaction([
      this.prisma.driver.findMany({
        where,
        include: {
          user: { include: { profile: true } },
          vehicles: true,
          documents: true,
        },
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.driver.count({ where }),
    ]);

    return { drivers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }`
);
fs.writeFileSync(drvSvcPath, drvSvcCode);

// ---------------------------------------------------------
// 2. Backend: drivers.controller.ts
// ---------------------------------------------------------
const drvCtrlPath = path.join('apps', 'backend', 'src', 'modules', 'drivers', 'drivers.controller.ts');
let drvCtrlCode = fs.readFileSync(drvCtrlPath, 'utf8');

drvCtrlCode = drvCtrlCode.replace(
/import \{ Controller, Get, Post, Body, Patch, Param, Delete, UseGuards \} from '@nestjs\/common';/,
`import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';`
);

drvCtrlCode = drvCtrlCode.replace(
/async findAll\(\) \{\s*return this\.driversService\.findAllDrivers\(\);\s*\}/,
`async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.driversService.findAllDrivers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      search,
      status,
    );
  }`
);
fs.writeFileSync(drvCtrlPath, drvCtrlCode);

console.log('Fixed backend drivers pagination');
