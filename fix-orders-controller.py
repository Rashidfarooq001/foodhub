import sys
with open('apps/backend/src/modules/orders/orders.controller.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_fn = '''  async findAll(
    @Request() req: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';

    // ADMIN ROUTE: Always use getAllOrders for admins.
    // Admins can optionally filter by restaurantId via query param, but their JWT restaurantId
    // won't restrict them.
    if (isAdmin) {
      if (restaurantId) {
        return this.ordersService.getRestaurantOrders(restaurantId, +page, +limit);
      }
      return this.ordersService.getAllOrders(status, +page, +limit);
    }'''

new_fn = '''  @ApiQuery({ name: 'search', required: false })
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
        return this.ordersService.getRestaurantOrders(restaurantId, +page, +limit);
      }
      return this.ordersService.getAllOrders(status, search, +page, +limit);
    }'''

content = content.replace(old_fn, new_fn)

with open('apps/backend/src/modules/orders/orders.controller.ts', 'w', encoding='utf-8') as f:
    f.write(content)
