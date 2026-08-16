import { TaxEngineService } from '../src/modules/tax/tax-engine.service';
import { PricingService, PricingConfigDto } from '../src/modules/pricing/pricing.service';
import { DistanceService } from '../src/modules/geolocation/distance.service';
import { OrderQuoteService } from '../src/modules/tax/order-quote.service';

/**
 * In-Memory Mock PrismaService for Deterministic Unit Testing of
 * Commission Resolution Hierarchy, 0% Rule, and Snapshot Immutability.
 */
class InMemoryPrismaService {
  restaurants: Map<string, any> = new Map();
  pricingConfigs: any[] = [];
  orders: Map<string, any> = new Map();
  auditLogs: any[] = [];

  restaurant = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      return this.restaurants.get(where.id) || null;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const current = this.restaurants.get(where.id);
      const updated = { ...current, ...data };
      this.restaurants.set(where.id, updated);
      return updated;
    },
  };

  pricingConfig = {
    findFirst: async () => {
      return this.pricingConfigs[this.pricingConfigs.length - 1] || null;
    },
  };

  order = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      return this.orders.get(where.id) || null;
    },
    create: async ({ data }: { data: any }) => {
      const order = { id: 'ord-' + Math.random().toString(36).slice(2, 9), ...data };
      this.orders.set(order.id, order);
      return order;
    },
  };

  auditLog = {
    create: async ({ data }: { data: any }) => {
      const log = { id: 'audit-' + Math.random().toString(36).slice(2, 9), createdAt: new Date(), ...data };
      this.auditLogs.push(log);
      return log;
    },
  };
}

async function runUnitCommissionTest() {
  console.log('====================================================');
  console.log('STARTING COMMISSION ARCHITECTURE & IMMUTABILITY TEST');
  console.log('====================================================\n');

  const mockPrisma = new InMemoryPrismaService();
  const taxEngine = new TaxEngineService(mockPrisma as any);
  const pricingService = new PricingService(mockPrisma as any);
  const distanceService = new DistanceService(mockPrisma as any);
  const quoteService = new OrderQuoteService(mockPrisma as any, taxEngine, pricingService, distanceService);

  // 1. Setup Global PricingConfig with NULL commission (UNCONFIGURED fallback)
  console.log('STEP 1: Testing Global PricingConfig default (UNCONFIGURED fallback)...');
  mockPrisma.pricingConfigs.push({
    restaurantCommissionPercent: null, // UNCONFIGURED
    customerDeliveryPerKm: 0.0,
    minimumCustomerDeliveryFee: 15.0,
    platformFee: 3.0,
    smallOrderThreshold: 0.0,
    smallOrderFee: 0.0,
    riderBasePay: 25.0,
    riderPerKmPay: 6.0,
  });

  // 2. Setup 3 Test Restaurants
  console.log('STEP 2: Initializing Test Restaurants...');
  const restA = {
    id: 'rest-A-null',
    name: 'Restaurant A (Unconfigured NULL)',
    commissionRate: null,
  };
  const restB = {
    id: 'rest-B-zero',
    name: 'Restaurant B (Configured 0%)',
    commissionRate: 0.0, // Explicit 0%
  };
  const restC = {
    id: 'rest-C-fifteen',
    name: 'Restaurant C (Configured 15%)',
    commissionRate: 15.0, // Explicit 15%
  };

  mockPrisma.restaurants.set(restA.id, restA);
  mockPrisma.restaurants.set(restB.id, restB);
  mockPrisma.restaurants.set(restC.id, restC);

  // 3. Test Quote on Restaurant A (NULL rate)
  console.log('\nSTEP 3: Calculating Quote for Restaurant A (commissionRate = NULL)...');
  const quoteA = await quoteService.calculateQuote({
    restaurantId: restA.id,
    foodSubtotal: 500,
  });
  console.log('-> Quote A result:', {
    commissionRate: quoteA.commissionRate,
    commissionStatus: quoteA.commissionStatus,
    commissionAmount: quoteA.restaurantCommission,
    customerTotal: quoteA.customerTotal,
    restaurantSettlement: quoteA.restaurantSettlement,
  });

  if (quoteA.commissionRate !== null) throw new Error(`Expected quoteA.commissionRate to be null, got ${quoteA.commissionRate}`);
  if (quoteA.commissionStatus !== 'UNCONFIGURED') throw new Error(`Expected quoteA.commissionStatus to be UNCONFIGURED, got ${quoteA.commissionStatus}`);
  if (quoteA.restaurantCommission !== 0) throw new Error(`Expected quoteA.restaurantCommission to be 0, got ${quoteA.restaurantCommission}`);
  if (quoteA.restaurantSettlement !== 500) throw new Error(`Expected quoteA.restaurantSettlement to be 500, got ${quoteA.restaurantSettlement}`);
  console.log('✓ PASS: Restaurant A correctly resolved to UNCONFIGURED with ₹0.00 commission deduction.');

  // 4. Test Quote on Restaurant B (0% rate)
  console.log('\nSTEP 4: Calculating Quote for Restaurant B (commissionRate = 0.0%)...');
  const quoteB = await quoteService.calculateQuote({
    restaurantId: restB.id,
    foodSubtotal: 500,
  });
  console.log('-> Quote B result:', {
    commissionRate: quoteB.commissionRate,
    commissionStatus: quoteB.commissionStatus,
    commissionAmount: quoteB.restaurantCommission,
    customerTotal: quoteB.customerTotal,
    restaurantSettlement: quoteB.restaurantSettlement,
  });

  if (quoteB.commissionRate !== 0) throw new Error(`Expected quoteB.commissionRate to be 0, got ${quoteB.commissionRate}`);
  if (quoteB.commissionStatus !== 'CONFIGURED') throw new Error(`Expected quoteB.commissionStatus to be CONFIGURED, got ${quoteB.commissionStatus}`);
  if (quoteB.restaurantCommission !== 0) throw new Error(`Expected quoteB.restaurantCommission to be 0, got ${quoteB.restaurantCommission}`);
  if (quoteB.restaurantSettlement !== 500) throw new Error(`Expected quoteB.restaurantSettlement to be 500, got ${quoteB.restaurantSettlement}`);
  console.log('✓ PASS: Restaurant B correctly resolved to CONFIGURED 0% (NOT UNCONFIGURED).');

  // 5. Test Quote on Restaurant C (15% rate)
  console.log('\nSTEP 5: Calculating Quote for Restaurant C (commissionRate = 15.0%)...');
  const quoteC = await quoteService.calculateQuote({
    restaurantId: restC.id,
    foodSubtotal: 500,
  });
  console.log('-> Quote C result:', {
    commissionRate: quoteC.commissionRate,
    commissionStatus: quoteC.commissionStatus,
    commissionAmount: quoteC.restaurantCommission,
    customerTotal: quoteC.customerTotal,
    restaurantSettlement: quoteC.restaurantSettlement,
  });

  if (quoteC.commissionRate !== 15) throw new Error(`Expected quoteC.commissionRate to be 15, got ${quoteC.commissionRate}`);
  if (quoteC.commissionStatus !== 'CONFIGURED') throw new Error(`Expected quoteC.commissionStatus to be CONFIGURED, got ${quoteC.commissionStatus}`);
  if (quoteC.restaurantCommission !== 75) throw new Error(`Expected quoteC.restaurantCommission to be 75, got ${quoteC.restaurantCommission}`);
  if (quoteC.restaurantSettlement !== 425) throw new Error(`Expected quoteC.restaurantSettlement to be 425, got ${quoteC.restaurantSettlement}`);
  console.log('✓ PASS: Restaurant C correctly resolved to CONFIGURED 15% (₹75 commission on ₹500 food).');

  // 6. Create Historical Order #1 for Restaurant C (15%)
  console.log('\nSTEP 6: Creating Historical Order #1 for Restaurant C with 15% snapshot...');
  const order1 = await mockPrisma.order.create({
    data: {
      orderNumber: 'ORD-HISTORICAL-001',
      restaurantId: restC.id,
      subtotal: 500,
      pricingSnapshot: {
        commissionRate: quoteC.commissionRate,
        commissionStatus: quoteC.commissionStatus,
        commissionAmount: quoteC.restaurantCommission,
        restaurantGross: 500,
        restaurantNet: 425,
        platformRevenue: 78,
      },
    },
  });
  console.log('-> Order #1 saved in database:', order1.pricingSnapshot);

  // 7. Admin updates Restaurant C to 20% in database
  console.log('\nSTEP 7: Admin updates Restaurant C commission rate to 20%...');
  mockPrisma.restaurant.update({
    where: { id: restC.id },
    data: { commissionRate: 20.0 },
  });
  await mockPrisma.auditLog.create({
    data: {
      action: 'UPDATE',
      entityName: 'RestaurantCommission',
      entityId: restC.id,
      oldValue: { commissionRate: 15.0 },
      newValue: { commissionRate: 20.0 },
    },
  });

  // 8. Create NEW Order #2 for Restaurant C
  console.log('\nSTEP 8: Creating NEW Order #2 for Restaurant C after rate update...');
  const quoteCNew = await quoteService.calculateQuote({
    restaurantId: restC.id,
    foodSubtotal: 500,
  });
  console.log('-> New Quote C result:', {
    commissionRate: quoteCNew.commissionRate,
    commissionStatus: quoteCNew.commissionStatus,
    commissionAmount: quoteCNew.restaurantCommission,
    customerTotal: quoteCNew.customerTotal,
    restaurantSettlement: quoteCNew.restaurantSettlement,
  });

  if (quoteCNew.commissionRate !== 20 || quoteCNew.restaurantCommission !== 100) {
    throw new Error('Expected new quote to be 20% (₹100 commission), got ' + quoteCNew.restaurantCommission);
  }

  const order2 = await mockPrisma.order.create({
    data: {
      orderNumber: 'ORD-NEW-002',
      restaurantId: restC.id,
      subtotal: 500,
      pricingSnapshot: {
        commissionRate: quoteCNew.commissionRate,
        commissionStatus: quoteCNew.commissionStatus,
        commissionAmount: quoteCNew.restaurantCommission,
        restaurantGross: 500,
        restaurantNet: 400,
        platformRevenue: 103,
      },
    },
  });
  console.log('-> Order #2 saved in database:', order2.pricingSnapshot);

  // 9. Verify IMMUTABILITY: Historical Order #1 MUST retain 15%
  console.log('\nSTEP 9: Verifying Snapshot Immutability across historical and new orders...');
  const checkOrder1 = await mockPrisma.order.findUnique({ where: { id: order1.id } });
  const checkOrder2 = await mockPrisma.order.findUnique({ where: { id: order2.id } });

  console.log('Database verification:');
  console.log('- Historical Order #1 Snapshot Commission:', checkOrder1.pricingSnapshot.commissionRate + '%', `(₹${checkOrder1.pricingSnapshot.commissionAmount})`);
  console.log('- New Order #2 Snapshot Commission:       ', checkOrder2.pricingSnapshot.commissionRate + '%', `(₹${checkOrder2.pricingSnapshot.commissionAmount})`);

  if (checkOrder1.pricingSnapshot.commissionRate !== 15 || checkOrder1.pricingSnapshot.commissionAmount !== 75) {
    throw new Error('CRITICAL FAILURE: Historical Order #1 commission was mutated or recalculated!');
  }
  if (checkOrder2.pricingSnapshot.commissionRate !== 20 || checkOrder2.pricingSnapshot.commissionAmount !== 100) {
    throw new Error('CRITICAL FAILURE: New Order #2 commission snapshot was not set to 20%!');
  }

  console.log('\n====================================================');
  console.log('ALL CRITICAL COMMISSION ARCHITECTURE TESTS: PASSED!');
  console.log('====================================================');
}

runUnitCommissionTest().catch((e) => {
  console.error('TEST ERROR:', e);
  process.exit(1);
});
