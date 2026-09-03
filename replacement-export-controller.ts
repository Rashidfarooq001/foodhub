  @Get('restaurant/export')
  @ApiOperation({ summary: 'Export restaurant report as CSV' })
  @ApiQuery({ name: 'type', description: 'Report type: orders' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async exportRestaurantCsv(
    @Request() req: any,
    @Query('type') type: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const fromDate = new Date(from || new Date(Date.now() - 30 * 86400000).toISOString());
    const toDate = new Date(to || new Date().toISOString());
    
    // We pass req.user.restaurantId to a new service method
    const csv = await this.analyticsService.exportRestaurantCsv(req.user.restaurantId, type ?? 'orders', fromDate, toDate);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      \ttachment; filename="\-\.csv"\,
    );
    res.send(csv);
  }
