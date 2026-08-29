const fs = require('fs');
const path = require('path');
const file = path.join('apps', 'backend', 'src', 'modules', 'settlements', 'settlements.service.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/async recordRiderPayment\([\s\S]*?\/\*\*[\s\S]*?async triggerPlatformPayouts/m, `async recordRiderPayment(
    driverId: string,
    dto: { amount: number; paymentMethod: string; transactionReference: string; notes?: string },
    adminUserId: string,
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    
    await this.prisma.riderSettlement.updateMany({
      where: {
        driverId,
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

    return { success: true, message: 'Rider settlement marked as paid.' };
  }

  /**
   * Platform payouts
   */
  async triggerPlatformPayouts`);

fs.writeFileSync(file, content, 'utf8');
console.log("Patched recordRiderPayment.");
