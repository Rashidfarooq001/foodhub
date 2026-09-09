const fs = require('fs');
const path = require('path');

const restSvcPath = path.join('apps', 'backend', 'src', 'modules', 'restaurants', 'restaurants.service.ts');
let restSvcCode = fs.readFileSync(restSvcPath, 'utf8');

restSvcCode = restSvcCode.replace(
/async findAllRestaurants\(adminView = false, userLat\?: number, userLng\?: number\) \{[\s\S]*?return sorted\.slice\(0, 50\);\s*\}/g,
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
