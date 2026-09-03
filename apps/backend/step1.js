const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const orderNumbers = ['FH-351823','FH-768759','FH-609271'];
  for (const num of orderNumbers) {
    const order = await p.order.findFirst({
      where: { orderNumber: num },
      include: {
        deliveryJob: {
          include: {
            driver: {
              include: {
                user: { include: { profile: true } }
              }
            }
          }
        }
      }
    });
    if (!order) { console.log(num + ': ORDER NOT FOUND'); continue; }
    console.log('========================================');
    console.log('ORDER: ' + num);
    console.log('Order.id: ' + order.id);
    console.log('Order.status: ' + order.status);
    const dj = order.deliveryJob;
    if (!dj) { console.log('DELIVERY JOB: NONE'); continue; }
    console.log('DeliveryJob.id: ' + dj.id);
    console.log('DeliveryJob.orderId: ' + dj.orderId);
    console.log('DeliveryJob.driverId: ' + dj.driverId);
    console.log('DeliveryJob.status: ' + dj.status);
    const dr = dj.driver;
    if (!dr) { console.log('DRIVER: NULL (driverId is null)'); continue; }
    console.log('Driver.id: ' + dr.id);
    console.log('Driver.userId: ' + dr.userId);
    console.log('Driver.status: ' + dr.status);
    console.log('Driver.isApproved: ' + dr.isApproved);
    const u = dr.user;
    console.log('User.id: ' + u.id);
    console.log('User.role: ' + u.role);
    console.log('User.phone: ' + u.phone);
    console.log('User.isActive: ' + u.isActive);
    console.log('User.name: ' + (u.profile?.firstName || ''));
  }
}
run().catch(e => console.error(e.message)).finally(() => p.$disconnect());
