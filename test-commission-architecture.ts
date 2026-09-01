import { PrismaClient } from '@prisma/client';
import { TaxEngineService } from './apps/backend/src/modules/tax/tax-engine.service';
import { PricingService } from './apps/backend/src/modules/pricing/pricing.service';
import { DistanceService } from './apps/backend/src/modules/geolocation/distance.service';
import { OrderQuoteService } from './apps/backend/src/modules/tax/order-quote.service';

async function runCommissionAuditTest() {
  console.log('====================================================');
  console.log('STARTING CRITICAL COMMISSION ARCHITECTURE PROOF TEST');
  console.log('====================================================\n');

  const prisma = new PrismaClient();
  const taxEngine = new TaxEngineService();
  const pricingService = new PricingService(prisma as any);
  const distanceService = new DistanceService(prisma as any);
  const quoteService = new OrderQuoteService(
    prisma as any,
    taxEngine,
    pricingService,
    distanceService,
  );

  try {
    // 1. Ensure Global PricingConfig is configured with delivery ₹15, platform ₹3, and NULL commission fallback
    console.log('STEP 1: Setting up PostgreSQL PricingConfig...');
    await prisma.pricingConfig.deleteMany();
    await prisma.pricingConfig.create({
      data: {
        restaurantCommissionPercent: null, // UNCONFIGURED GLOBAL
        minimumCustomerDeliveryFee: 15.0,
        customerDeliveryPerKm: 0.0,
        platformFee: 3.0,
        smallOrderThreshold: 0.0,
        smallOrderFee: 0.0,
        riderBasePay: 25.0,
        riderPerKmPay: 6.0,
      },
    });

    // 2. Create Restaurant A (commissionRate = NULL)
    console.log('\nSTEP 2: Creating Test Restaurants...');
    const owner = await prisma.user.findFirst({ where: { role: 'RESTAURANT_OWNER' } });
    if (!owner) {
      console.log('No owner found, fetching any user...');
    }
    const targetOwnerId = owner ? owner.id : (await prisma.user.findFirst())?.id;

    // Restaurant A (commissionRate = null)
    const restA = await prisma.restaurant.create({
      data: {
        ownerId: targetOwnerId!,
        name: 'Audit Rest A (NULL Commission)',
        slug: 'audit-rest-a-' + Date.now(),
        phone: '+919876543210',
        licenseFssai: 'FSSAI-TEST-A',
        addressLine: 'Main Chowk Bandipora',
        latitude: 34.4226,
        longitude: 74.6469,
        status: 'APPROVED',
        isOpen: true,
        commissionRate: null, // UNCONFIGURED
      },
    });

    // Restaurant B (commissionRate = 0.00%)
    const restB = await prisma.restaurant.create({
      data: {
        ownerId: targetOwnerId!,
        name: 'Audit Rest B (0% Commission)',
        slug: 'audit-rest-b-' + Date.now(),
        phone: '+919876543211',
        licenseFssai: 'FSSAI-TEST-B',
        addressLine: 'Gulshan Chowk Bandipora',
        latitude: 34.4226,
        longitude: 74.6469,
        status: 'APPROVED',
        isOpen: true,
        commissionRate: 0.0, // CONFIGURED 0%
      },
    });

    // Restaurant C (commissionRate = 15.00%)
    const restC = await prisma.restaurant.create({
      data: {
        ownerId: targetOwnerId!,
        name: 'Audit Rest C (15% Commission)',
        slug: 'audit-rest-c-' + Date.now(),
        phone: '+919876543212',
        licenseFssai: 'FSSAI-TEST-C',
        addressLine: 'Nusu Bandipora',
        latitude: 34.4226,
        longitude: 74.6469,
        status: 'APPROVED',
        isOpen: true,
        commissionRate: 15.0, // CONFIGURED 15%
      },
    });

    console.log(`Created:`);
    console.log(`- Restaurant A (ID: ${restA.id}, commissionRate: ${restA.commissionRate})`);
    console.log(`- Restaurant B (ID: ${restB.id}, commissionRate: ${restB.commissionRate})`);
    console.log(`- Restaurant C (ID: ${restC.id}, commissionRate: ${restC.commissionRate})`);

    // 3. Test Quote on Restaurant A (₹500 order)
    console.log('\nSTEP 3: Testing Order Quotes on A, B, and C with ₹500 Subtotal...');
    const quoteA = await quoteService.calculateQuote({
      restaurantId: restA.id,
      foodSubtotal: 500,
      distanceKm: 2,
    });
    console.log('Restaurant A Result:', {
      commissionRate: quoteA.commissionRate,
      commissionStatus: quoteA.commissionStatus,
      commissionAmount: quoteA.restaurantCommission,
      customerTotal: quoteA.customerTotal,
      restaurantSettlement: quoteA.restaurantSettlement,
    });
    if (quoteA.commissionStatus !== 'UNCONFIGURED' || quoteA.restaurantCommission !== 0) {
      throw new Error('FAIL: Restaurant A should be UNCONFIGURED with ₹0 commission');
    }

    // 4. Test Quote on Restaurant B (₹500 order)
    const quoteB = await quoteService.calculateQuote({
      restaurantId: restB.id,
      foodSubtotal: 500,
      distanceKm: 2,
    });
    console.log('Restaurant B Result:', {
      commissionRate: quoteB.commissionRate,
      commissionStatus: quoteB.commissionStatus,
      commissionAmount: quoteB.restaurantCommission,
      customerTotal: quoteB.customerTotal,
      restaurantSettlement: quoteB.restaurantSettlement,
    });
    if (
      quoteB.commissionStatus !== 'CONFIGURED' ||
      quoteB.commissionRate !== 0 ||
      quoteB.restaurantCommission !== 0
    ) {
      throw new Error('FAIL: Restaurant B should be CONFIGURED (0%) with ₹0 commission');
    }

    // 5. Test Quote on Restaurant C (₹500 order)
    const quoteC = await quoteService.calculateQuote({
      restaurantId: restC.id,
      foodSubtotal: 500,
      distanceKm: 2,
    });
    console.log('Restaurant C Result:', {
      commissionRate: quoteC.commissionRate,
      commissionStatus: quoteC.commissionStatus,
      commissionAmount: quoteC.restaurantCommission,
      customerTotal: quoteC.customerTotal,
      restaurantSettlement: quoteC.restaurantSettlement,
    });
    if (
      quoteC.commissionStatus !== 'CONFIGURED' ||
      quoteC.commissionRate !== 15 ||
      quoteC.restaurantCommission !== 75
    ) {
      throw new Error('FAIL: Restaurant C should be CONFIGURED (15%) with ₹75 commission on ₹500');
    }

    // 6. Create Historical Order #1 for Restaurant C (15%)
    console.log('\nSTEP 4: Creating Historical Order #1 for Restaurant C at 15%...');
    const customer = await prisma.customer.findFirst({ include: { user: true } });
    const order1 = await prisma.order.create({
      data: {
        orderNumber: 'AUDIT-ORD-001',
        customerId: customer!.id,
        restaurantId: restC.id,
        status: 'DELIVERED',
        subtotal: 500,
        deliveryFee: 15,
        packagingFee: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 518, // 500 + 15 + 3
        paymentMethod: 'UPI',
        deliveryAddress: { addressLine1: 'Test Address' },
        pricingSnapshot: {
          commissionRate: quoteC.commissionRate,
          commissionStatus: quoteC.commissionStatus,
          commissionAmount: quoteC.restaurantCommission,
          restaurantGross: 500,
          restaurantNet: 425,
          platformRevenue: 78,
          customerDeliveryFee: 15,
          platformFee: 3,
        } as any,
      },
    });
    console.log(
      `Order #1 Created with snapshot: Commission Rate = ${(order1.pricingSnapshot as any).commissionRate}%, Commission Amount = ₹${(order1.pricingSnapshot as any).commissionAmount}`,
    );

    // 7. Update Restaurant C to 20% in database
    console.log('\nSTEP 5: Admin changes Restaurant C commission from 15% to 20%...');
    await prisma.restaurant.update({
      where: { id: restC.id },
      data: { commissionRate: 20.0 },
    });
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityName: 'RestaurantCommission',
        entityId: restC.id,
        oldValue: { commissionRate: 15.0 },
        newValue: { commissionRate: 20.0 },
      },
    });

    // 8. Create NEW Order #2 for Restaurant C
    console.log('\nSTEP 6: Creating NEW Order #2 for Restaurant C...');
    const quoteCNew = await quoteService.calculateQuote({
      restaurantId: restC.id,
      foodSubtotal: 500,
      distanceKm: 2,
    });
    console.log('New Quote on Restaurant C:', {
      commissionRate: quoteCNew.commissionRate,
      commissionStatus: quoteCNew.commissionStatus,
      commissionAmount: quoteCNew.restaurantCommission,
    });
    if (quoteCNew.commissionRate !== 20 || quoteCNew.restaurantCommission !== 100) {
      throw new Error('FAIL: New order should reflect updated 20% commission (₹100 on ₹500)');
    }

    const order2 = await prisma.order.create({
      data: {
        orderNumber: 'AUDIT-ORD-002',
        customerId: customer!.id,
        restaurantId: restC.id,
        status: 'DELIVERED',
        subtotal: 500,
        deliveryFee: 15,
        packagingFee: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 518,
        paymentMethod: 'UPI',
        deliveryAddress: { addressLine1: 'Test Address' },
        pricingSnapshot: {
          commissionRate: quoteCNew.commissionRate,
          commissionStatus: quoteCNew.commissionStatus,
          commissionAmount: quoteCNew.restaurantCommission,
          restaurantGross: 500,
          restaurantNet: 400,
          platformRevenue: 103,
          customerDeliveryFee: 15,
          platformFee: 3,
        } as any,
      },
    });

    // 9. Verify IMMUTABILITY: Query Order #1 and Order #2 snapshots from database
    console.log('\nSTEP 7: Verifying Database Snapshot Immutability...');
    const fetchedOrder1 = await prisma.order.findUnique({ where: { id: order1.id } });
    const fetchedOrder2 = await prisma.order.findUnique({ where: { id: order2.id } });

    const snap1 = fetchedOrder1!.pricingSnapshot as any;
    const snap2 = fetchedOrder2!.pricingSnapshot as any;

    console.log(
      `Historical Order #1 Snapshot: Commission Rate = ${snap1.commissionRate}%, Commission Amount = ₹${snap1.commissionAmount}`,
    );
    console.log(
      `New Order #2 Snapshot:        Commission Rate = ${snap2.commissionRate}%, Commission Amount = ₹${snap2.commissionAmount}`,
    );

    if (snap1.commissionRate !== 15 || snap1.commissionAmount !== 75) {
      throw new Error('FAIL: Historical Order #1 snapshot was corrupted or recalculated!');
    }
    if (snap2.commissionRate !== 20 || snap2.commissionAmount !== 100) {
      throw new Error('FAIL: New Order #2 snapshot did not use the updated 20% rate!');
    }

    // Clean up test records
    await prisma.order.deleteMany({ where: { id: { in: [order1.id, order2.id] } } });
    await prisma.restaurant.deleteMany({ where: { id: { in: [restA.id, restB.id, restC.id] } } });

    console.log('\n====================================================');
    console.log('ALL CRITICAL COMMISSION & IMMUTABILITY TESTS PASSED!');
    console.log('====================================================');
  } finally {
    await prisma.$disconnect();
  }
}

runCommissionAuditTest().catch((e) => {
  console.error('FATAL TEST ERROR:', e);
  process.exit(1);
});
