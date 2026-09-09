const fs = require('fs');
const path = require('path');

const repoPath = path.join('apps', 'backend', 'src', 'modules', 'orders', 'orders.repository.ts');
let repoCode = fs.readFileSync(repoPath, 'utf8');

if (!repoCode.includes('async getCountsByRestaurant(')) {
  repoCode = repoCode.replace(
    /async findByRestaurant\(/,
    `async getCountsByRestaurant(restaurantId: string) {
    const counts = await this.prisma.order.groupBy({
      by: ['status'],
      where: { restaurantId, deletedAt: null },
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);
  }

  async findByRestaurant(`
  );
  
  repoCode = repoCode.replace(
/async findByRestaurant\(restaurantId: string, status\?: any, page = 1, limit = 20\) \{[\s\S]*?take: limit,\s*\}\);\s*return orders;\s*\}/g,
`async findByRestaurant(restaurantId: string, status?: any, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    let statusFilter: any = undefined;
    if (typeof status === 'string' && status.includes(',')) {
      statusFilter = { in: status.split(',').map((s) => s.trim()) };
    } else if (status) {
      statusFilter = status;
    }

    const where: any = {
      restaurantId,
      ...(statusFilter ? { status: statusFilter } : {}),
      deletedAt: null,
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          orderItems: { include: { foodItem: true } },
          restaurant: { select: { id: true, name: true, addressLine: true, phone: true, deliveryMode: true, latitude: true, longitude: true } },
          customer: { include: { user: { include: { profile: true } } } },
          deliveryJob: { include: { driver: { include: { user: { include: { profile: true } } } } } },
          tracking: true,
          orderTimelines: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }`
  );
  fs.writeFileSync(repoPath, repoCode);
}

const svcPath = path.join('apps', 'backend', 'src', 'modules', 'orders', 'orders.service.ts');
let svcCode = fs.readFileSync(svcPath, 'utf8');

if (!svcCode.includes('getRestaurantOrderCounts(')) {
  svcCode = svcCode.replace(
    /async getRestaurantOrders\(/,
    `async getRestaurantOrderCounts(restaurantId: string) {
    return this.repo.getCountsByRestaurant(restaurantId);
  }

  async getRestaurantOrders(`
  );
  
  svcCode = svcCode.replace(
/async getRestaurantOrders\([\s\S]*?\) \{[\s\S]*?const res = await this\.repo\.findByRestaurant\(restaurantId, status, page, limit\);\s*return serializePrisma\(res\);\s*\}/g,
`async getRestaurantOrders(restaurantId: string, status?: any, page?: number, limit?: number) {
    const res = await this.repo.findByRestaurant(restaurantId, status, page, limit);
    return {
      ...res,
      orders: serializePrisma(res.orders)
    };
  }`
  );
  fs.writeFileSync(svcPath, svcCode);
}

const ctrlPath = path.join('apps', 'backend', 'src', 'modules', 'orders', 'orders.controller.ts');
let ctrlCode = fs.readFileSync(ctrlPath, 'utf8');

if (!ctrlCode.includes('@Get(\'counts\')')) {
  ctrlCode = ctrlCode.replace(
    /@Get\('active'\)/,
    `@Get('counts')
  @ApiOperation({ summary: 'Get order counts by status for a restaurant' })
  async getCounts(@Request() req: any, @Query('restaurantId') restaurantId?: string) {
    const id = req.user?.role === 'RESTAURANT_OWNER' || req.user?.role === 'RESTAURANT_STAFF' 
      ? req.user.restaurantId 
      : restaurantId;
    if (!id) return {};
    return this.ordersService.getRestaurantOrderCounts(id);
  }

  @Get('active')`
  );
  fs.writeFileSync(ctrlPath, ctrlCode);
}

console.log('Fixed backend orders pagination and counts');
