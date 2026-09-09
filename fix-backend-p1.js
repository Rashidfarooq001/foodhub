const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------
// P1-1: Drivers Backend Pagination
// ---------------------------------------------------------
const drvSvcPath = path.join('apps', 'backend', 'src', 'modules', 'drivers', 'drivers.service.ts');
let drvSvcCode = fs.readFileSync(drvSvcPath, 'utf8');

if (!drvSvcCode.includes('async findAllDrivers(page = 1')) {
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
}

const drvCtrlPath = path.join('apps', 'backend', 'src', 'modules', 'drivers', 'drivers.controller.ts');
let drvCtrlCode = fs.readFileSync(drvCtrlPath, 'utf8');

if (!drvCtrlCode.includes('@Query(\'page\')')) {
  drvCtrlCode = drvCtrlCode.replace(/import \{([^\}]+)\} from '@nestjs\/common';/, (match, p1) => {
    if (!p1.includes('Query')) {
      return `import {${p1}, Query } from '@nestjs/common';`;
    }
    return match;
  });

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
}

console.log('Fixed backend drivers');

// ---------------------------------------------------------
// P1-2: Restaurants Backend Pagination
// ---------------------------------------------------------
const restSvcPath = path.join('apps', 'backend', 'src', 'modules', 'restaurants', 'restaurants.service.ts');
let restSvcCode = fs.readFileSync(restSvcPath, 'utf8');

if (!restSvcCode.includes('page = 1')) {
  restSvcCode = restSvcCode.replace(
/async findAllRestaurants\(adminView = false, userLat\?: number, userLng\?: number\) \{[\s\S]*?return adminView \? restaurants : sorted\.slice\(0, 50\);\s*\}/g,
`async findAllRestaurants(
    adminView = false, 
    userLat?: number, 
    userLng?: number,
    page = 1,
    limit = 50,
    search?: string,
    statusFilter?: string
  ) {
    const whereCondition: any = adminView
      ? { deletedAt: null }
      : { status: 'APPROVED', deletedAt: null };

    if (adminView && statusFilter && statusFilter !== 'ALL') {
      whereCondition.status = statusFilter;
    }

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    if (adminView) {
      const [restaurants, total] = await this.prisma.$transaction([
        this.prisma.restaurant.findMany({
          where: whereCondition,
          include: {
            documents: true,
            galleries: true,
            bankAccount: true,
            timings: true,
            settings: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.restaurant.count({ where: whereCondition }),
      ]);
      return { restaurants, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // Customer View
    const restaurants = await this.prisma.restaurant.findMany({
      where: whereCondition,
      include: {
        categories: { include: { foodItems: { where: { deletedAt: null } } } },
        documents: true, galleries: true, bankAccount: true, timings: true, settings: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit customer search radius scope
    });

    let distances = new Map<string, number>();
    let etas = new Map<string, number>();

    if (userLat !== undefined && userLng !== undefined) {
      const destinations = restaurants.map(
        (r) => [r.latitude || 0, r.longitude || 0] as [number, number],
      );
      try {
        const matrixResults = await this.geolocationService.computeDistanceMatrix(
          [userLat, userLng],
          destinations,
        );
        restaurants.forEach((rest, index) => {
          const result = matrixResults[index];
          distances.set(rest.id, result.distance);
          etas.set(rest.id, result.duration);
        });
      } catch (err) {
        this.logger.warn('Distance matrix calculation failed in findAllRestaurants', err);
      }
    }

    const mapped = restaurants.map((r) => {
      const dist = distances.get(r.id) || 0;
      const t = etas.get(r.id) || 0;
      return {
        ...r,
        distanceMatrix: { distance: dist, duration: t },
        deliveryFee: dist <= 3 ? 15 : 15 + Math.ceil(dist - 3) * 5,
      };
    });

    const sorted = mapped.sort((a, b) => a.distanceMatrix.distance - b.distanceMatrix.distance);
    return sorted.slice(0, 50);
  }`
  );
  fs.writeFileSync(restSvcPath, restSvcCode);
}

const restCtrlPath = path.join('apps', 'backend', 'src', 'modules', 'restaurants', 'restaurants.controller.ts');
let restCtrlCode = fs.readFileSync(restCtrlPath, 'utf8');

if (!restCtrlCode.includes('@Query(\'page\')')) {
  restCtrlCode = restCtrlCode.replace(
/async findAll\([\s\S]*?\)\s*\{[\s\S]*?return this\.restaurantsService\.findAllRestaurants\(admin === 'true', userLat, userLng\);\s*\}/g,
`async findAll(
    @Query('admin') admin?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const userLat = lat ? parseFloat(lat) : undefined;
    const userLng = lng ? parseFloat(lng) : undefined;
    return this.restaurantsService.findAllRestaurants(
      admin === 'true',
      userLat,
      userLng,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      search,
      status
    );
  }`
  );
  fs.writeFileSync(restCtrlPath, restCtrlCode);
}
console.log('Fixed backend restaurants');

// ---------------------------------------------------------
// P1-3: Customers Backend Pagination
// ---------------------------------------------------------
const usrSvcPath = path.join('apps', 'backend', 'src', 'modules', 'users', 'users.service.ts');
let usrSvcCode = fs.readFileSync(usrSvcPath, 'utf8');

if (!usrSvcCode.includes('page = 1')) {
  usrSvcCode = usrSvcCode.replace(
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
  fs.writeFileSync(usrSvcPath, usrSvcCode);
}

const usrCtrlPath = path.join('apps', 'backend', 'src', 'modules', 'users', 'users.controller.ts');
let usrCtrlCode = fs.readFileSync(usrCtrlPath, 'utf8');

if (!usrCtrlCode.includes('@Query(\'page\')')) {
  usrCtrlCode = usrCtrlCode.replace(
/async findAllCustomers\(\s*@Query\('limit'\) limit: string,\s*@Query\('search'\) search: string,\s*\) \{[\s\S]*?\}\s*\}/g,
`async findAllCustomers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('status') status: string,
  ) {
    const l = limit ? parseInt(limit, 10) : 50;
    const p = page ? parseInt(page, 10) : 1;
    return this.usersService.findAllCustomers(p, l, search || '', status);
  }`
  );
  fs.writeFileSync(usrCtrlPath, usrCtrlCode);
}
console.log('Fixed backend customers');

