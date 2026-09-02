import re

filepath = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\backend\src\modules\drivers\delivery-jobs.controller.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
'''    const allCompletedOrders = await this.prisma.order.findMany({
      where: {
        assignedFoodHubDriverId: driver.id,
        status: 'DELIVERED',
      },
      include: {
        deliveryJob: { select: { riderPayout: true, deliveredAt: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });''',
'''    const allCompletedOrders = await this.prisma.order.findMany({
      where: {
        deliveryJob: { driverId: driver.id },
        status: 'DELIVERED',
      },
      include: {
        deliveryJob: { select: { riderPayout: true, deliveredAt: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });'''
)

content = content.replace(
'''    const completedOrders = await this.prisma.order.findMany({
      where: {
        assignedFoodHubDriverId: driver.id,
        status: 'DELIVERED',
      },
      include: {
        restaurant: { select: { name: true } },
        deliveryJob: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });''',
'''    const completedOrders = await this.prisma.order.findMany({
      where: {
        deliveryJob: { driverId: driver.id },
        status: 'DELIVERED',
      },
      include: {
        restaurant: { select: { name: true } },
        deliveryJob: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });'''
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
