const fs = require('fs');
const path = require('path');
const file = path.join(
  'apps',
  'backend',
  'src',
  'modules',
  'orders',
  'order-state-machine.service.ts',
);
let content = fs.readFileSync(file, 'utf8');

const generateSettlementsMethod = `
  private async generateSettlements(tx: any, order: any) {
    const snap: any = order.pricingSnapshot || {};
    const now = new Date();

    // 1. Restaurant Settlement
    const foodSubtotal = snap.restaurantGross !== undefined ? Number(snap.restaurantGross) : Number(order.subtotal || 0);
    const commissionRate = snap.commissionRate !== undefined ? Number(snap.commissionRate) : 13.0;
    const commissionAmount = snap.commissionAmount !== undefined ? Number(snap.commissionAmount) : Math.round((foodSubtotal * commissionRate) / 100 * 100) / 100;
    const commissionGstAmount = snap.commissionGstAmount !== undefined ? Number(snap.commissionGstAmount) : Math.round(commissionAmount * 0.18 * 100) / 100;
    const deductions = snap.packagingFee !== undefined ? Number(snap.packagingFee) : 0;
    const restaurantNet = snap.restaurantNet !== undefined ? Number(snap.restaurantNet) : Math.round((foodSubtotal - commissionAmount - commissionGstAmount + deductions) * 100) / 100;

    await tx.restaurantSettlement.upsert({
      where: { orderId: order.id },
      create: {
        restaurantId: order.restaurantId,
        orderId: order.id,
        periodStart: now,
        periodEnd: now,
        grossAmount: foodSubtotal,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        deductions: deductions,
        netPayable: restaurantNet,
        status: 'ELIGIBLE',
      },
      update: {}
    });

    // 2. Rider Settlement
    if (order.deliveryJob && order.deliveryJob.driverId) {
      const basePayout = snap.riderBasePayout !== undefined ? Number(snap.riderBasePayout) : 30;
      const distancePayout = snap.deliveryFeePerExtraKm !== undefined ? Number(snap.deliveryFeePerExtraKm) * Math.max(0, (snap.deliveryDistanceKm || 0) - (snap.deliveryFeeBaseKm || 3)) : 0;
      const netPayout = Number(order.deliveryJob.riderPayout || Math.max(30, Math.round(Number(order.deliveryJob.deliveryFee || 40) * 0.8)));

      await tx.riderSettlement.upsert({
        where: { orderId: order.id },
        create: {
          driverId: order.deliveryJob.driverId,
          orderId: order.id,
          periodStart: now,
          periodEnd: now,
          basePayoutAmount: basePayout,
          distancePayout: distancePayout,
          netPayable: netPayout,
          status: 'ELIGIBLE',
        },
        update: {}
      });
    }
  }
`;

// Insert method before the last closing brace
content = content.replace(/}\s*$/, generateSettlementsMethod + '\n}\n');

content = content.replace(
  /message: 'Order delivered successfully to customer.',\s*},\s*}\);\s*return updated;/g,
  `message: 'Order delivered successfully to customer.',
        },
      });

      await this.generateSettlements(tx, updated);

      return updated;`,
);

content = content.replace(
  /message: this\.getTimelineMessage\(targetStatus, extraData\?.reason\),\s*},\s*}\);\s*return updatedOrderRecord;/g,
  `message: this.getTimelineMessage(targetStatus, extraData?.reason),
        },
      });

      if (targetStatus === OrderStatus.DELIVERED) {
        await this.generateSettlements(tx, updatedOrderRecord);
      }

      return updatedOrderRecord;`,
);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched order-state-machine.service.ts');
