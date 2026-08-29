const fs = require('fs');
const path = require('path');
const file = path.join('apps', 'backend', 'src', 'modules', 'settlements', 'settlements.service.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/async recordRestaurantPayment\([\s\S]*?\/\*\*[\s\S]*?async getRiderSettlements/m, `async recordRestaurantPayment(
    restaurantId: string,
    dto: { amount: number; paymentMethod: string; transactionReference: string; notes?: string },
    adminUserId: string,
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    
    // We update all pending settlements for this restaurant in the period
    await this.prisma.restaurantSettlement.updateMany({
      where: {
        restaurantId,
        status: 'PENDING',
        periodStart: { gte: period.periodStart },
        periodEnd: { lte: period.periodEnd },
      },
      data: {
        status: 'PAID',
        utrNumber: dto.transactionReference,
        settledAt: new Date(),
        adminId: adminUserId,
        notes: dto.notes,
      }
    });

    return { success: true, message: 'Settlement marked as paid.' };
  }

  /**
   * Rider settlements
   */
  async getRiderSettlements`);

fs.writeFileSync(file, content, 'utf8');
console.log("Patched recordRestaurantPayment.");
