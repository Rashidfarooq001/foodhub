const fs = require('fs');
const path = require('path');
const file = path.join(
  'apps',
  'backend',
  'src',
  'modules',
  'settlements',
  'settlements.service.ts',
);
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /import { PrismaService } from "@foodhub\/utils";/g,
  'import { PrismaService } from "../../core/prisma/prisma.service";',
);

// Add missing methods
content = content.replace(
  /async getUnifiedTransactions\(\) \{ return \[\]; \}/g,
  `async getUnifiedTransactions() { return []; }

  async getSettlementHistory(restaurantId: string) {
    return this.prisma.restaurantSettlement.findMany({ where: { restaurantId }, orderBy: { periodStart: 'desc' } });
  }

  async recordRestaurantManualPayment(restaurantId: string, dto: any, adminUserId: string) {
    return this.recordRestaurantPayment(restaurantId, dto, adminUserId);
  }

  async recordRiderManualPayment(driverId: string, dto: any, adminUserId: string) {
    return this.recordRiderPayment(driverId, dto, adminUserId);
  }

  async getFinancialAuditLogs() {
    return [];
  }

  async getReconciliationReport() {
    return { data: [] };
  }`,
);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched service');
