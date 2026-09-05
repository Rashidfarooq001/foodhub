const fs = require('fs');

const servicePath = 'apps/backend/src/modules/coupons/coupons.service.ts';
let service = fs.readFileSync(servicePath, 'utf8');
if (!service.includes('async deleteCoupon')) {
  service = service.replace(
    /async deactivateCoupon\(couponId: string\) \{[\s\S]*?\n  \}/,
    `async deactivateCoupon(couponId: string) {
    const coupon = await this.prisma.coupon.update({
      where: { id: couponId },
      data: { status: CouponStatus.INACTIVE },
    });
    this.eventsGateway.server.emit('coupon:updated', { couponId: coupon.id, action: 'deactivated' });
    return coupon;
  }

  async deleteCoupon(couponId: string) {
    const coupon = await this.prisma.coupon.delete({
      where: { id: couponId },
    });
    this.eventsGateway.server.emit('coupon:updated', { couponId: coupon.id, action: 'deleted' });
    return coupon;
  }

  async updateCoupon(couponId: string, dto: CreateCouponDto) {
    const coupon = await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        code: dto.code.toUpperCase(),
        couponType: dto.couponType,
        discountVal: dto.discountVal,
        minOrderVal: dto.minOrderVal || 0,
        maxDiscount: dto.maxDiscount || null,
        validFrom: new Date(dto.validFrom),
        validTill: new Date(dto.validTill),
        usageLimit: dto.usageLimit || null,
      },
    });
    this.eventsGateway.server.emit('coupon:updated', { couponId: coupon.id, action: 'updated' });
    return coupon;
  }`
  );
  fs.writeFileSync(servicePath, service);
}

const controllerPath = 'apps/backend/src/modules/coupons/coupons.controller.ts';
let controller = fs.readFileSync(controllerPath, 'utf8');
if (!controller.includes('async update(')) {
  controller = controller.replace(
    /async deactivate\(@Param\('id'\) id: string\) \{[\s\S]*?\n  \}/,
    `async deactivate(@Param('id') id: string) {
    return this.couponsService.deactivateCoupon(id);
  }

  @Delete(':id/hard')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin: Hard delete a coupon' })
  async deleteCoupon(@Param('id') id: string) {
    return this.couponsService.deleteCoupon(id);
  }

  @Post(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin: Update a coupon' })
  async update(@Param('id') id: string, @Body() dto: CreateCouponDto) {
    return this.couponsService.updateCoupon(id, dto);
  }`
  );
  fs.writeFileSync(controllerPath, controller);
}
console.log('Added delete/update to backend');
