  @Get('restaurant')
  @ApiOperation({ summary: 'Restaurant personal analytics dashboard' })
  @ApiQuery({ name: 'range', required: false, description: 'Time range period (7D, 30D, 90D)' })
  async restaurantStats(@Request() req: any, @Query('range') range: string = '7D') {
    return this.analyticsService.getRestaurantStats(req.user.restaurantId, range);
  }
