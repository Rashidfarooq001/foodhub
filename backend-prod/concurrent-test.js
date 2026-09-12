const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function run() {
  const couponCode = 'RACE_TEST_' + crypto.randomUUID().split('-')[0].toUpperCase();
  const coupon = await prisma.coupon.create({
    data: {
      code: couponCode,
      couponType: 'FLAT',
      discountVal: 50,
      usageLimit: 1, 
      validFrom: new Date(),
      validTill: new Date(Date.now() + 86400000),
      status: 'ACTIVE'
    }
  });

  const c1 = await prisma.customer.findFirst();
  const c2 = await prisma.customer.findMany({ skip: 1, take: 1 }).then(r => r[0]);
  const rest = await prisma.restaurant.findFirst();

  async function simulateCheckout(customerId, orderNum) {
    try {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber: orderNum,
            customer: { connect: { id: customerId } },
            restaurant: { connect: { id: rest.id } },
            status: 'PENDING',
            subtotal: 100,
            deliveryFee: 0,
            platformFee: 0,
            gstAmount: 0,
            totalAmount: 50,
            deliveryAddress: {}, 
          }
        });

        const lockedCoupons = await tx.$queryRawUnsafe(`SELECT id, usage_limit as "usageLimit" FROM coupons WHERE id = $1::uuid FOR UPDATE`, coupon.id);
        if (!lockedCoupons || lockedCoupons.length === 0) throw new Error('Coupon not found');
        
        const currentTotalUsage = await tx.couponUsage.count({ where: { couponId: coupon.id } });
        if (currentTotalUsage >= lockedCoupons[0].usageLimit) {
          throw new Error('Coupon usage limit has been reached');
        }

        try {
          await tx.couponUsage.create({
            data: {
              couponId: coupon.id,
              customerId: customerId,
              orderId: order.id,
            }
          });
        } catch (err) {
          if (err.code === 'P2002') throw new Error('You have already used this coupon');
          throw err;
        }

      }, { isolationLevel: 'ReadCommitted', timeout: 10000 });
      return { success: true, customerId };
    } catch (error) {
      return { success: false, customerId, error: error.message };
    }
  }

  const results = await Promise.all([
    simulateCheckout(c1.id, 'ORD-RACE-1'),
    simulateCheckout(c2.id, 'ORD-RACE-2')
  ]);

  console.log('Results A:', results);

  const couponMultiCode = 'RACE_MULTI_' + crypto.randomUUID().split('-')[0].toUpperCase();
  const couponMulti = await prisma.coupon.create({
    data: {
      code: couponMultiCode,
      couponType: 'FLAT',
      discountVal: 50,
      usageLimit: 100, 
      validFrom: new Date(),
      validTill: new Date(Date.now() + 86400000),
      status: 'ACTIVE'
    }
  });

  async function simulateCheckoutMulti(customerId, orderNum) {
    try {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber: orderNum,
            customer: { connect: { id: customerId } },
            restaurant: { connect: { id: rest.id } },
            status: 'PENDING',
            subtotal: 100,
            deliveryFee: 0,
            platformFee: 0,
            gstAmount: 0,
            totalAmount: 50,
            deliveryAddress: {}, 
          }
        });

        try {
          await tx.couponUsage.create({
            data: {
              couponId: couponMulti.id,
              customerId: customerId,
              orderId: order.id,
            }
          });
        } catch (err) {
          if (err.code === 'P2002') throw new Error('You have already used this coupon');
          throw err;
        }
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  const resultsB = await Promise.all([
    simulateCheckoutMulti(c1.id, 'ORD-RACE-3'),
    simulateCheckoutMulti(c1.id, 'ORD-RACE-4')
  ]);

  console.log('Results B:', resultsB);

  await prisma.order.deleteMany({ where: { orderNumber: { in: ['ORD-RACE-1', 'ORD-RACE-2', 'ORD-RACE-3', 'ORD-RACE-4'] } } });
  await prisma.couponUsage.deleteMany({ where: { couponId: { in: [coupon.id, couponMulti.id] } } });
  await prisma.coupon.deleteMany({ where: { id: { in: [coupon.id, couponMulti.id] } } });
}

run().catch(console.error).finally(() => prisma.$disconnect());
