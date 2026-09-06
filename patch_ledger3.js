const fs = require('fs');
const file = 'apps/backend/src/modules/orders/order-lifecycle.service.ts';
let content = fs.readFileSync(file, 'utf8');

const targetStr = "    }\n  }\n}";
const idx = content.lastIndexOf("    }\n  }\n}");

const ledgerSnippet = `
      // 3. Generate Ledger Entries
      const ledgerEntries = [];
      const orderTotal = Number(order.totalAmount || 0);
      
      if (orderTotal > 0) {
        ledgerEntries.push({
          orderId: order.id,
          transactionType: 'CUSTOMER_PAYMENT_RECEIVED',
          amount: orderTotal,
          referenceId: order.orderNumber,
        });
      }

      if (foodSubtotal > 0) {
        ledgerEntries.push({
          orderId: order.id,
          transactionType: 'RESTAURANT_FOOD_VALUE',
          amount: foodSubtotal,
          referenceId: order.orderNumber,
        });
      }

      const restGst = snap.restaurantFoodGst !== undefined ? Number(snap.restaurantFoodGst) : 0;
      if (restGst > 0) {
        ledgerEntries.push({
          orderId: order.id,
          transactionType: 'RESTAURANT_GST_PAYABLE',
          amount: restGst,
          referenceId: order.orderNumber,
        });
      }

      const platFee = snap.platformFee !== undefined ? Number(snap.platformFee) : 0;
      if (platFee > 0) {
        ledgerEntries.push({
          orderId: order.id,
          transactionType: 'PLATFORM_FEE_REVENUE',
          amount: platFee,
          referenceId: order.orderNumber,
        });
      }

      const platFeeGst = snap.platformFeeGst !== undefined ? Number(snap.platformFeeGst) : 0;
      if (platFeeGst > 0) {
        ledgerEntries.push({
          orderId: order.id,
          transactionType: 'PLATFORM_FEE_GST_PAYABLE',
          amount: platFeeGst,
          referenceId: order.orderNumber,
        });
      }

      if (commissionAmount > 0) {
        ledgerEntries.push({
          orderId: order.id,
          transactionType: 'ZAYKAFOOD_COMMISSION_REVENUE',
          amount: commissionAmount,
          referenceId: order.orderNumber,
        });
      }

      if (commissionGst > 0) {
        ledgerEntries.push({
          orderId: order.id,
          transactionType: 'COMMISSION_GST_PAYABLE',
          amount: commissionGst,
          referenceId: order.orderNumber,
        });
      }

      if (order.deliveryJob && order.deliveryJob.driverId) {
        const netPayout = Number(
          order.deliveryJob.riderPayout ??
            Math.max(30, Math.round(Number(order.deliveryJob.deliveryFee || 40) * 0.8)),
        );
        ledgerEntries.push({
          orderId: order.id,
          transactionType: 'RIDER_DELIVERY_PAYABLE',
          amount: netPayout,
          referenceId: order.orderNumber,
        });
      }

      if (ledgerEntries.length > 0) {
        await tx.ledgerEntry.createMany({
          data: ledgerEntries,
        });
      }
    }
}
`;

if (idx !== -1) {
  content = content.substring(0, idx) + ledgerSnippet;
  fs.writeFileSync(file, content);
  console.log("Success");
} else {
  console.log("Failed to find replacement target.");
}
