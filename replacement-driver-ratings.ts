  @Get('ratings')
  @ApiOperation({ summary: 'Get canonical ratings distribution for driver' })
  async getDriverRatings(@Request() req: any) {
    const driver = await this.getDriverFromReq(req);
    if (!driver) return { average: 0, total: 0, distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 } };

    const reviews = await this.prisma.driverReview.findMany({
      where: { driverId: driver.id },
      select: { rating: true },
    });

    const total = reviews.length;
    let sum = 0;
    const distribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };

    for (const r of reviews) {
      sum += r.rating;
      if (distribution[r.rating.toString()] !== undefined) {
        distribution[r.rating.toString()]++;
      }
    }

    const average = total > 0 ? Number((sum / total).toFixed(1)) : 0;

    return { average, total, distribution };
  }
