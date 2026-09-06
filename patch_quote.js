const fs = require('fs');
const file = 'apps/backend/src/modules/tax/order-quote.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace Delivery Calculation
content = content.replace(
  /const deliveryFeeBaseKm = 3\.0;[\s\S]*?customerDeliveryFee = null; \/\/ Unresolved \/ null when route calculation is unavailable\s+\}/g,
  `const deliveryRatePerKm = config.customerDeliveryPerKm ?? 15.0;

    let customerDeliveryFee: number | null = null;
    if (routeAvailable && distanceKm !== null && distanceKm >= 0) {
      customerDeliveryFee = Math.round((distanceKm * deliveryRatePerKm) * 100) / 100;
    } else {
      customerDeliveryFee = null; // Unresolved / null when route calculation is unavailable
    }`
);

// Replace Tax Calculations
content = content.replace(
  /const foodTax = await this\.taxEngine\.calculateTaxComponent\(\{[\s\S]*?totalCustomerTaxes =[\s\S]*?100\)? \/ 100;/g,
  `const foodTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'RESTAURANT_FOOD_SERVICE',
      taxableAmount: foodSubtotal,
      supplierState: restaurantState,
      recipientState: customerState,
    });

    const platformTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'PLATFORM_FEE',
      taxableAmount: platformFee,
      supplierState: 'J&K',
      recipientState: customerState,
    });

    const smallOrderTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'SMALL_ORDER_FEE',
      taxableAmount: smallOrderFee,
      supplierState: 'J&K',
      recipientState: customerState,
    });

    const deliveryTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'DELIVERY_SERVICE',
      taxableAmount: customerDeliveryFee || 0,
      supplierState: 'J&K',
      recipientState: customerState,
    });

    const tipTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'RIDER_TIP',
      taxableAmount: tipAmount,
      supplierState: customerState,
      recipientState: customerState,
    });

    const taxItems: TaxComponentOutput[] = [
      foodTax,
      platformTax,
      smallOrderTax,
      deliveryTax,
      tipTax,
    ];

    const restaurantFoodGst = foodTax.totalTax;
    const platformFeeGst = platformTax.totalTax;
    const smallOrderFeeGst = smallOrderTax.totalTax;
    const deliveryFeeGst = deliveryTax.totalTax;
    
    // totalCustomerTaxes is now based strictly on the components
    const totalCustomerTaxes = Math.round((restaurantFoodGst + platformFeeGst + smallOrderFeeGst + deliveryFeeGst) * 100) / 100;`
);

// Replace Rider Payout
content = content.replace(
  /const riderBasePay = config\.riderBasePay;[\s\S]*?Math\.round\([\s\S]*?\) \*[\s\S]*?100\) \/ 100;/g,
  `const riderBasePay = 0;
    const riderDistancePay = customerDeliveryFee || 0; // Rider gets exactly the customer delivery fee based on ZaykaFood model
    const riderTip = tipAmount; // 100% pass-through
    const totalRiderPayout = Math.round((riderDistancePay + riderTip) * 100) / 100;`
);

// Add missing delivery properties at the end of the return object to satisfy TS interface
content = content.replace(
  /deliveryFeePerExtraKm,[\s\S]*?\};/g,
  `deliveryFeeBaseKm: 0,
      deliveryFeeBaseAmount: 0,
      deliveryFeePerExtraKm: deliveryRatePerKm,
    };`
);

fs.writeFileSync(file, content);
