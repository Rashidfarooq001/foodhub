import { TaxEngineService } from '../src/modules/tax/tax-engine.service';
import { PricingService } from '../src/modules/pricing/pricing.service';
import { DistanceService } from '../src/modules/geolocation/distance.service';
import { OrderQuoteService } from '../src/modules/tax/order-quote.service';

/**
 * Unit Test for Distance-Based Customer Delivery Fee Engine & Rounding Consistency
 * Tests the authoritative formula:
 * if (distance <= 3) { deliveryFee = 15 }
 * else { deliveryFee = 15 + ((distance - 3) * 5) }
 *
 * Distance points tested:
 * - 0 km    -> ₹15.00
 * - 1 km    -> ₹15.00
 * - 2 km    -> ₹15.00
 * - 3 km    -> ₹15.00
 * - 3.1 km  -> ₹15.50
 * - 4 km    -> ₹20.00
 * - 5 km    -> ₹25.00
 * - 6 km    -> ₹30.00
 * - 10 km   -> ₹50.00
 *
 * Pricing Examples tested:
 * - ₹500 food + 2 km -> ₹518 customer total
 * - ₹500 food + 5 km -> ₹528 customer total
 */

class MockDistancePrisma {
  restaurants: Map<string, any> = new Map();
  pricingConfigs: any[] = [];
  orders: Map<string, any> = new Map();

  restaurant = {
    findUnique: async ({ where }: { where: { id: string } }) => this.restaurants.get(where.id) || null,
  };

  pricingConfig = {
    findFirst: async () => this.pricingConfigs[this.pricingConfigs.length - 1] || null,
  };

  order = {
    create: async ({ data }: { data: any }) => {
      const ord = { id: 'ord-' + Math.random().toString(36).slice(2, 9), ...data };
      this.orders.set(ord.id, ord);
      return ord;
    },
    findUnique: async ({ where }: { where: { id: string } }) => this.orders.get(where.id) || null,
  };
}

async function runDistanceDeliveryFeeTests() {
  console.log('========================================================================');
  console.log('STARTING AUTHORITATIVE DISTANCE-BASED DELIVERY FEE VERIFICATION TEST');
  console.log('========================================================================\n');

  const prisma = new MockDistancePrisma();
  const taxEngine = new TaxEngineService(prisma as any);
  const pricingService = new PricingService(prisma as any);
  const distanceService = new DistanceService(prisma as any);
  const quoteService = new OrderQuoteService(prisma as any, taxEngine, pricingService, distanceService);

  // Setup Standard PostgreSQL Pricing Configuration
  prisma.pricingConfigs.push({
    restaurantCommissionPercent: null,
    customerDeliveryPerKm: 0.0,
    minimumCustomerDeliveryFee: 15.0,
    platformFee: 3.0,
    smallOrderThreshold: 0.0,
    smallOrderFee: 0.0,
    riderBasePay: 25.0,
    riderPerKmPay: 6.0,
    paymentGatewayPlanningRate: 2.0,
  });

  // Setup Test Restaurant with 15 km delivery radius
  const restTest = {
    id: 'rest-bandipora-01',
    name: 'Wazwan Palace Bandipora',
    phone: '+919876543201',
    latitude: 34.4226,
    longitude: 74.6469,
    deliveryRadius: 15.0,
    commissionRate: 15.0,
  };
  prisma.restaurants.set(restTest.id, restTest);

  // 1. TEST ALL 9 MANDATORY DISTANCE POINTS
  const testMatrix = [
    { distanceKm: 0, expectedFee: 15.00 },
    { distanceKm: 1, expectedFee: 15.00 },
    { distanceKm: 2, expectedFee: 15.00 },
    { distanceKm: 3, expectedFee: 15.00 },
    { distanceKm: 3.1, expectedFee: 15.50 },
    { distanceKm: 4, expectedFee: 20.00 },
    { distanceKm: 5, expectedFee: 25.00 },
    { distanceKm: 6, expectedFee: 30.00 },
    { distanceKm: 10, expectedFee: 50.00 },
  ];

  console.log('STEP 1: Testing 9 Specific Distance Test Points against the formula:');
  console.log('  Formula: if distance <= 3 -> ₹15; else -> 15 + ((distance - 3) * 5)\n');

  for (const test of testMatrix) {
    const quote = await quoteService.calculateQuote({
      restaurantId: restTest.id,
      foodSubtotal: 500,
      distanceKm: test.distanceKm,
    });

    console.log(`- Distance ${test.distanceKm.toString().padEnd(4)} km: Expected Fee = ₹${test.expectedFee.toFixed(2)}, Actual Quote Fee = ₹${quote.customerDeliveryFee.toFixed(2)} -> ${quote.customerDeliveryFee === test.expectedFee ? '✓ PASS' : '❌ FAIL'}`);

    if (quote.customerDeliveryFee !== test.expectedFee) {
      throw new Error(`Distance Fee Mismatch at ${test.distanceKm} km: Expected ₹${test.expectedFee}, got ₹${quote.customerDeliveryFee}`);
    }

    if (quote.deliveryDistanceKm !== test.distanceKm) {
      throw new Error(`deliveryDistanceKm mismatch: Expected ${test.distanceKm}, got ${quote.deliveryDistanceKm}`);
    }
  }

  // 2. TEST USER PRICING EXAMPLES
  console.log('\nSTEP 2: Testing User Pricing Examples:');
  
  // Example A: ₹500 food subtotal + 2 km delivery
  console.log('\n  [Example A: ₹500 Food Subtotal + 2 km Delivery]');
  const quoteExampleA = await quoteService.calculateQuote({
    restaurantId: restTest.id,
    foodSubtotal: 500,
    distanceKm: 2,
  });
  console.log(`  Food Subtotal:     ₹${quoteExampleA.foodSubtotal}`);
  console.log(`  Delivery Fee:      ₹${quoteExampleA.customerDeliveryFee} (Expected: ₹15)`);
  console.log(`  Platform Fee:      ₹${quoteExampleA.platformFee} (Expected: ₹3)`);
  console.log(`  GST:               ₹${quoteExampleA.totalCustomerTaxes} (Expected: ₹0)`);
  console.log(`  Small Order Fee:   ₹${quoteExampleA.smallOrderFee} (Expected: ₹0)`);
  console.log(`  Customer Total:    ₹${quoteExampleA.customerTotal} (Expected: ₹518)`);

  if (quoteExampleA.customerDeliveryFee !== 15 || quoteExampleA.customerTotal !== 518) {
    throw new Error(`Example A failed: Expected ₹518 total, got ₹${quoteExampleA.customerTotal}`);
  }
  console.log('  ✓ Example A Result: 100% MATCH (₹518)');

  // Example B: ₹500 food subtotal + 5 km delivery
  console.log('\n  [Example B: ₹500 Food Subtotal + 5 km Delivery]');
  const quoteExampleB = await quoteService.calculateQuote({
    restaurantId: restTest.id,
    foodSubtotal: 500,
    distanceKm: 5,
  });
  console.log(`  Food Subtotal:     ₹${quoteExampleB.foodSubtotal}`);
  console.log(`  Delivery Fee:      ₹${quoteExampleB.customerDeliveryFee} (Expected: ₹25)`);
  console.log(`  Platform Fee:      ₹${quoteExampleB.platformFee} (Expected: ₹3)`);
  console.log(`  GST:               ₹${quoteExampleB.totalCustomerTaxes} (Expected: ₹0)`);
  console.log(`  Small Order Fee:   ₹${quoteExampleB.smallOrderFee} (Expected: ₹0)`);
  console.log(`  Customer Total:    ₹${quoteExampleB.customerTotal} (Expected: ₹528)`);

  if (quoteExampleB.customerDeliveryFee !== 25 || quoteExampleB.customerTotal !== 528) {
    throw new Error(`Example B failed: Expected ₹528 total, got ₹${quoteExampleB.customerTotal}`);
  }
  console.log('  ✓ Example B Result: 100% MATCH (₹528)');

  // 3. TEST ORDER CREATION & IMMUTABLE SNAPSHOT RETENTION
  console.log('\nSTEP 3: Testing Order Creation & Immutable Snapshot Persistence for 5 km Order:');
  const order5Km = await prisma.order.create({
    data: {
      orderNumber: 'ORD-5KM-001',
      restaurantId: restTest.id,
      subtotal: quoteExampleB.foodSubtotal,
      deliveryFee: quoteExampleB.customerDeliveryFee,
      platformFee: quoteExampleB.platformFee,
      taxAmount: 0,
      totalAmount: quoteExampleB.customerTotal,
      pricingSnapshot: {
        commissionRate: quoteExampleB.commissionRate,
        commissionStatus: quoteExampleB.commissionStatus,
        commissionAmount: quoteExampleB.restaurantCommission,
        restaurantGross: quoteExampleB.foodSubtotal,
        restaurantNet: quoteExampleB.restaurantSettlement,
        platformRevenue: quoteExampleB.platformOperatingRevenue,
        platformFee: quoteExampleB.platformFee,
        customerDeliveryFee: quoteExampleB.customerDeliveryFee,
        deliveryDistanceKm: quoteExampleB.deliveryDistanceKm,
        deliveryFeeBaseKm: quoteExampleB.deliveryFeeBaseKm,
        deliveryFeeBaseAmount: quoteExampleB.deliveryFeeBaseAmount,
        deliveryFeePerExtraKm: quoteExampleB.deliveryFeePerExtraKm,
        riderPayout: quoteExampleB.totalRiderPayout,
      },
    },
  });

  const fetchedOrder = await prisma.order.findUnique({ where: { id: order5Km.id } });
  const snap = fetchedOrder.pricingSnapshot;
  console.log('  Persisted Snapshot:', snap);

  if (snap.customerDeliveryFee !== 25 || snap.deliveryDistanceKm !== 5 || snap.deliveryFeeBaseKm !== 3 || snap.deliveryFeeBaseAmount !== 15 || snap.deliveryFeePerExtraKm !== 5) {
    throw new Error('Snapshot verification failed for distance-based delivery fee metadata!');
  }
  console.log('  ✓ Order Financial Snapshot contains exact delivery distance and breakdown metadata.');

  console.log('\n========================================================================');
  console.log('ALL DISTANCE-BASED DELIVERY FEE VERIFICATION TESTS: 100% PASSED!');
  console.log('========================================================================');
}

runDistanceDeliveryFeeTests().catch((e) => {
  console.error('FATAL DISTANCE FEE TEST ERROR:', e);
  process.exit(1);
});
