const fs = require('fs');

const servicePath = 'apps/backend/src/modules/menus/menus.service.ts';
let serviceCode = fs.readFileSync(servicePath, 'utf8');

const getRecommendationsCode = `
  async getRecommendations(limit: number = 12, customerLat?: number, customerLng?: number) {
    // 1. Find most ordered food items
    const topItems = await this.prisma.orderItem.groupBy({
      by: ['foodItemId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 50,
      where: {
        foodItemId: { not: null },
      },
    });

    let foodItemIds = topItems.map(t => t.foodItemId as string);

    // If not enough history, fetch some latest items
    if (foodItemIds.length < limit) {
      const fallback = await this.prisma.foodItem.findMany({
        where: {
          isAvailable: true,
          deletedAt: null,
          restaurant: { isOpen: true, isActive: true },
        },
        select: { id: true },
        take: 50,
        orderBy: { createdAt: 'desc' }
      });
      fallback.forEach(f => {
        if (!foodItemIds.includes(f.id)) {
          foodItemIds.push(f.id);
        }
      });
    }

    // 2. Fetch full item details
    const rawItems = await this.prisma.foodItem.findMany({
      where: {
        id: { in: foodItemIds },
        isAvailable: true,
        deletedAt: null,
        restaurant: { isOpen: true, isActive: true },
      },
      include: {
        restaurant: {
          select: { id: true, name: true, rating: true, isOnline: true }
        },
        category: { select: { id: true, name: true } }
      }
    });

    // 3. Sort by order count (topItems)
    const orderMap = new Map();
    topItems.forEach((t, idx) => {
      orderMap.set(t.foodItemId, topItems.length - idx); // higher score for first
    });

    rawItems.sort((a, b) => {
      const scoreA = orderMap.get(a.id) || 0;
      const scoreB = orderMap.get(b.id) || 0;
      return scoreB - scoreA;
    });

    // 4. Diversify by restaurant (max 2 items per restaurant)
    const finalItems = [];
    const restCount = new Map<string, number>();

    for (const item of rawItems) {
      const count = restCount.get(item.restaurantId) || 0;
      if (count < 2) {
        finalItems.push(item);
        restCount.set(item.restaurantId, count + 1);
      }
      if (finalItems.length >= limit) break;
    }

    return serializePrisma(finalItems);
  }
`;

// Insert before `async createFoodItem`
serviceCode = serviceCode.replace('async createFoodItem', getRecommendationsCode + '\n  async createFoodItem');
fs.writeFileSync(servicePath, serviceCode, 'utf8');

const controllerPath = 'apps/backend/src/modules/menus/menus.controller.ts';
let controllerCode = fs.readFileSync(controllerPath, 'utf8');

const getRecommendationsControllerCode = `
  @Public()
  @Get('recommendations')
  @ApiOperation({ summary: 'Get dynamic food recommendations' })
  async getRecommendations() {
    return this.menusService.getRecommendations(12);
  }
`;

controllerCode = controllerCode.replace('// ==================================================\n  // FOOD ITEM ENDPOINTS\n  // ==================================================', '// ==================================================\n  // FOOD ITEM ENDPOINTS\n  // ==================================================\n' + getRecommendationsControllerCode);
fs.writeFileSync(controllerPath, controllerCode, 'utf8');

console.log('Backend patched.');
