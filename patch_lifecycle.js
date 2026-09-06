const fs = require('fs');
const file = 'apps/backend/src/modules/orders/order-lifecycle.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the restaurant settlement creation
content = content.replace(
  /await tx\.restaurantSettlement\.upsert\(\{[\s\S]*?update: \{\},[\s\S]*?\}\);/g,
  `
    const commissionGst = commissionGstAmount;
    const commissionTotal = Math.round((commissionAmount + commissionGst) * 100) / 100;
    const applicableTds = 0; // Configured separately in settlement module later if needed
    const applicableTcs = 0; // Prompt: Do not deduct normal GST TCS from restaurant settlement for 9(5)
    
    await tx.restaurantSettlement.upsert({
      where: { orderId: order.id },
      create: {
        restaurantId: order.restaurantId,
        orderId: order.id,
        periodStart: now,
        periodEnd: now,
        foodSubtotal: foodSubtotal,
        grossAmount: foodSubtotal,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        commissionGst: commissionGst,
        commissionTotal: commissionTotal,
        applicableTds: applicableTds,
        applicableTcs: applicableTcs,
        deductions: deductions,
        otherAdjustments: 0,
        netPayable: restaurantNet,
        status: 'ELIGIBLE',
      },
      update: {},
    });
`
);

// Replace rider settlement creation
content = content.replace(
  /await tx\.riderSettlement\.upsert\(\{[\s\S]*?update: \{\},[\s\S]*?\}\);/g,
  `
      const deliveryDistanceKm = snap.deliveryDistanceKm !== undefined ? Number(snap.deliveryDistanceKm) : 0;
      const deliveryRate = snap.deliveryFeePerExtraKm !== undefined ? Number(snap.deliveryFeePerExtraKm) : 15;
      const applicableTdsRider = 0; // TDS will be computed when generating the actual payout if applicable
      
      await tx.riderSettlement.upsert({
        where: { orderId: order.id },
        create: {
          driverId: order.deliveryJob.driverId,
          orderId: order.id,
          periodStart: now,
          periodEnd: now,
          basePayoutAmount: basePayout,
          distancePayout: distancePayout,
          deliveryDistanceKm: deliveryDistanceKm,
          deliveryRate: deliveryRate,
          applicableTds: applicableTdsRider,
          otherAdjustments: 0,
          deductions: applicableTdsRider,
          netPayable: netPayout,
          status: 'ELIGIBLE',
        },
        update: {},
      });
`
);

fs.writeFileSync(file, content);
