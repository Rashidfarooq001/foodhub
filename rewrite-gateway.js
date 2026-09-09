const fs = require('fs');
const file = 'apps/backend/src/modules/orders/orders.gateway.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace handleJoinOrder
const joinOrderRegex = /@SubscribeMessage\('joinOrder'\)[\s\S]*?(?=@SubscribeMessage\('joinRestaurant'\))/;
const newJoinOrder = `@SubscribeMessage('joinOrder')
  async handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; token?: string },
  ): Promise<{ success: boolean; message?: string }> {
    if (!data?.orderId || !client) {
      return { success: false, message: 'orderId is required' };
    }
    const orderId = data.orderId;
    const user = this.extractUserFromSocket(client, data.token);

    if (!user) {
      client.emit('error', { message: 'Authentication required to join order channel' });
      return { success: false, message: 'Unauthorized' };
    }

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { deliveryJob: true },
      });

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      const isCustomer = user.customerId && order.customerId === user.customerId;
      const isRestaurant = user.restaurantId && order.restaurantId === user.restaurantId;
      const isAssignedDriver =
        (user.driverId && order.deliveryJob?.driverId === user.driverId) ||
        (user.driverId && order.assignedRestaurantDriverId === user.driverId);

      if (!isAdmin && !isCustomer && !isRestaurant && !isAssignedDriver) {
        this.logger.warn(\`Client \${client.id} (user \${user.id}) unauthorized for order:\${orderId}\`);
        client.emit('error', { message: 'Unauthorized to access order room' });
        return { success: false, message: 'Unauthorized' };
      }

      client.join(\`order:\${orderId}\`);
      this.logger.log(\`Client \${client.id} joined order:\${orderId}\`);
      client.emit('joinedOrder', { success: true, orderId });
      return { success: true };
    } catch (err: any) {
      this.logger.error(\`Error verifying order room \${orderId}: \${err?.message}\`);
      return { success: false, message: 'Internal Server Error' };
    }
  }

  `;
content = content.replace(joinOrderRegex, newJoinOrder);

// Replace handleJoinRestaurant
const joinRestaurantRegex = /@SubscribeMessage\('joinRestaurant'\)[\s\S]*?(?=@SubscribeMessage\('joinDriver'\))/;
const newJoinRestaurant = `@SubscribeMessage('joinRestaurant')
  async handleJoinRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { restaurantId: string; token?: string },
  ): Promise<{ success: boolean; message?: string }> {
    if (!data?.restaurantId || !client) {
      return { success: false, message: 'restaurantId is required' };
    }

    const restaurantId = data.restaurantId;
    const user = this.extractUserFromSocket(client, data.token);

    if (!user) {
      client.emit('error', { message: 'Authentication required' });
      return { success: false, message: 'Unauthorized' };
    }

    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const isAffiliated =
      user.restaurantId === restaurantId ||
      user.role === 'RESTAURANT_OWNER' ||
      user.role === 'RESTAURANT_STAFF';

    if (!isAdmin && !isAffiliated) {
      client.emit('error', { message: 'Unauthorized to join restaurant channel' });
      return { success: false, message: 'Unauthorized' };
    }

    client.join(\`restaurant:\${restaurantId}\`);
    this.logger.log(\`Client \${client.id} joined restaurant:\${restaurantId}\`);
    client.emit('joinedRestaurant', { success: true, restaurantId });
    return { success: true };
  }

  `;
content = content.replace(joinRestaurantRegex, newJoinRestaurant);

// Replace handleJoinDriver and handleJoinAvailableDrivers
const joinDriverRegex = /@SubscribeMessage\('joinDriver'\)[\s\S]*?(?=@SubscribeMessage\('joinAdmin'\))/;
const newJoinDriver = `@SubscribeMessage('joinDriver')
  async handleJoinDriver(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { driverId?: string; token?: string },
  ): Promise<{ success: boolean; message?: string }> {
    const user = this.extractUserFromSocket(client, data?.token);
    let driverId = data?.driverId;

    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (!driverId) {
      try {
        const driverRecord = await this.prisma.driver.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (driverRecord) {
          driverId = driverRecord.id;
          user.driverId = driverRecord.id;
        }
      } catch {
        /* fallback */
      }
    }

    if (!driverId || (user.driverId !== driverId && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return { success: false, message: 'Unauthorized to join this driver channel' };
    }

    client.join(\`driver:\${driverId}\`);
    client.join('drivers:available');
    this.logger.log(\`Client \${client.id} joined driver:\${driverId} and drivers:available\`);
    client.emit('joinedDriver', { success: true, driverId });
    return { success: true };
  }

  @SubscribeMessage('joinAvailableDrivers')
  handleJoinAvailableDrivers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { token?: string },
  ): { success: boolean; message?: string } {
    const user = this.extractUserFromSocket(client, data?.token);
    if (!user || (user.role !== 'DRIVER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return { success: false, message: 'Unauthorized to join available drivers channel' };
    }
    client.join('drivers:available');
    this.logger.log(\`Client \${client.id} joined drivers:available\`);
    client.emit('joinedAvailableDrivers', { success: true });
    return { success: true };
  }

  `;
content = content.replace(joinDriverRegex, newJoinDriver);

// Replace handleLocationUpdate
const locUpdateRegex = /@SubscribeMessage\('updateLocation'\)[\s\S]*?(?=\/\*\* Emit an event)/;
const newLocUpdate = `@SubscribeMessage('updateLocation')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; lat: number; lng: number; token?: string },
  ): Promise<{ success: boolean; message?: string } | void> {
    if (!data?.orderId || typeof data?.lat !== 'number' || typeof data?.lng !== 'number') {
      return { success: false, message: 'Invalid data' };
    }

    const user = this.extractUserFromSocket(client, data.token);
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: data.orderId },
        include: { deliveryJob: true },
      });

      if (!order) return { success: false, message: 'Order not found' };

      const isAssignedDriver =
        (user.driverId && order.deliveryJob?.driverId === user.driverId) ||
        (user.driverId && order.assignedRestaurantDriverId === user.driverId);
      
      const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

      if (!isAssignedDriver && !isAdmin) {
        return { success: false, message: 'Unauthorized to update location for this order' };
      }

      const sanitizedLoc = {
        orderId: data.orderId,
        lat: Number(data.lat),
        lng: Number(data.lng),
        updatedAt: new Date().toISOString(),
      };

      await this.prisma.orderTracking.upsert({
        where: { orderId: data.orderId },
        update: { currentLat: sanitizedLoc.lat, currentLng: sanitizedLoc.lng },
        create: { orderId: data.orderId, currentLat: sanitizedLoc.lat, currentLng: sanitizedLoc.lng },
      });

      this.emitToOrder(data.orderId, ORDER_EVENTS.DRIVER_LOCATION, sanitizedLoc);
      return { success: true };
    } catch (err) {
      this.logger.error('Failed to upsert order tracking from socket', err);
      return { success: false, message: 'Internal error' };
    }
  }

  `;
content = content.replace(locUpdateRegex, newLocUpdate);

fs.writeFileSync(file, content);
console.log("Rewrote orders.gateway.ts securely.");
