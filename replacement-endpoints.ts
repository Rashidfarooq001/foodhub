  @Get('ratings')
  @ApiOperation({ summary: 'Get canonical ratings and reviews for driver' })
  async getDriverRatings(@Request() req: any) {
    const driver = await this.getDriverFromReq(req);
    if (!driver) return [];

    const reviews = await this.prisma.driverReview.findMany({
      where: { driverId: driver.id },
      include: {
        order: { select: { orderNumber: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment || '',
      customerName: r.customer?.name || 'Customer',
      orderNumber: r.order?.orderNumber,
      createdAt: r.createdAt,
    }));
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get canonical notifications for driver' })
  async getDriverNotifications(@Request() req: any) {
    const driver = await this.getDriverFromReq(req);
    if (!driver || !driver.userId) return [];

    const notifications = await this.prisma.notification.findMany({
      where: { userId: driver.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      status: n.status,
      createdAt: n.createdAt,
    }));
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markNotificationRead(@Param('id') id: string, @Request() req: any) {
    const driver = await this.getDriverFromReq(req);
    if (!driver || !driver.userId) throw new ForbiddenException();

    const notification = await this.prisma.notification.findFirst({
      where: { id, userId: driver.userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.prisma.notification.update({
      where: { id },
      data: { status: 'READ' },
    });

    return { success: true };
  }
