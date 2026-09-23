import re

with open('apps/backend/src/modules/orders/orders.controller.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the findAll method entirely
pattern = r'(@ApiQuery\(\{ name: \'status\', required: false \}\)\n\s*@ApiQuery\(\{ name: \'page\', required: false \}\)\n\s*@ApiQuery\(\{ name: \'limit\', required: false \}\)\n\s*async findAll\([^}]+\}\n\s*\})'

new_method = '''@ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Request() req: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';

    if (isAdmin) {
      if (restaurantId) {
        return this.ordersService.getRestaurantOrders(restaurantId, status as any, +page, +limit);
      }
      return this.ordersService.getAllOrders(status as any, search, +page, +limit);
    }

    const targetRestId = restaurantId || req.user?.restaurantId;

    if (!targetRestId) {
      return {
        data: [],
        meta: { total: 0, page: 1, lastPage: 1 },
      };
    }

    return this.ordersService.getRestaurantOrders(targetRestId, status as any, +page, +limit);
  }'''

content = re.sub(
    r'@ApiQuery\(\{ name: \'status\'.*?return this\.ordersService\.getRestaurantOrders\(targetRestId, status as any, \+page, \+limit\);\n  \}',
    new_method,
    content,
    flags=re.DOTALL
)

with open('apps/backend/src/modules/orders/orders.controller.ts', 'w', encoding='utf-8') as f:
    f.write(content)
