const fs = require('fs');
const path = require('path');

const filePath = path.join('apps', 'backend', 'src', 'modules', 'orders', 'orders.gateway.ts');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Fix handleJoinUser
code = code.replace(
/const targetUserId = data\?\.userId \|\| user\?\.id;\s*if \(!targetUserId\) \{[\s\S]*?if \(user && user\.id !== targetUserId && user\.role !== 'ADMIN' && user\.role !== 'SUPER_ADMIN'\) \{/g,
`const targetUserId = data?.userId || user?.id;

    if (!user) {
      client.emit('error', { message: 'Authentication required' });
      return { success: false, message: 'Authentication required' };
    }

    if (!targetUserId) {
      client.emit('error', { message: 'Authentication required to join user channel' });
      return { success: false, message: 'Authentication required' };
    }

    if (user.id !== targetUserId && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {`
);

// 2. Fix handleJoinOrder
code = code.replace(
/\/\/ Authorization verification if authenticated user\s*if \(user\) \{([\s\S]*?)client\.join\(\`order:\$\{orderId\}\`\);/g,
`// Authorization verification required
        if (!user) {
          client.emit('error', { message: 'Authentication required' });
          return { success: false, message: 'Authentication required' };
        }
        
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
        const isCustomer = order.customer?.userId === user.id || order.customerId === user.id;
        const isRestaurant =
          order.restaurantId === user.restaurantId || order.restaurant?.ownerId === user.id;
        const isAssignedDriver =
          order.deliveryJob?.driver?.userId === user.id ||
          (user.driverId && order.deliveryJob?.driverId === user.driverId) ||
          (user.driverId && order.assignedRestaurantDriverId === user.driverId);

        // If authenticated user is unrelated customer/driver, forbid
        if (!isAdmin && !isCustomer && !isRestaurant && !isAssignedDriver) {
          this.logger.warn(
            \`Client \${client.id} (user \${user.id}) unauthorized for order:\${orderId}\`,
          );
          client.emit('error', { message: 'Unauthorized to access order room' });
          return { success: false, message: 'Unauthorized' };
        }

        client.join(\`order:\${orderId}\`);`
);

// 3. Fix handleJoinRestaurant
code = code.replace(
/if \(user\) \{\s*const isAdmin = user\.role === 'ADMIN'([\s\S]*?)return \{ success: false, message: 'Unauthorized' \};\s*\}\s*\}/g,
`if (!user) {
        client.emit('error', { message: 'Authentication required' });
        return { success: false, message: 'Authentication required' };
      }

      const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      const isAffiliated =
        user.restaurantId === restaurantId ||
        user.role === 'RESTAURANT_OWNER' ||
        user.role === 'RESTAURANT_STAFF';
      
      if (!isAdmin && !isAffiliated) {
        client.emit('error', { message: 'Unauthorized to join restaurant channel' });
        return { success: false, message: 'Unauthorized' };
      }`
);

// 4. Fix handleJoinDriver
code = code.replace(
/const user = this\.extractUserFromSocket\(client, data\?\.token\);\s*let driverId = data\?\.driverId;\s*if \(!driverId && user\) \{[\s\S]*?if \(driverId\) \{/g,
`const user = this.extractUserFromSocket(client, data?.token);
    let driverId = data?.driverId;

    if (!user) {
      client.emit('error', { message: 'Authentication required' });
      return { success: false, message: 'Authentication required' };
    }

    if (!driverId && user) {
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

    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const isOwner = user.driverId === driverId || user.id === driverId; // Simple ownership check
    
    if (!isAdmin && !isOwner) {
       client.emit('error', { message: 'Unauthorized to join driver channel' });
       return { success: false, message: 'Unauthorized' };
    }

    if (driverId) {`
);

// 5. Fix handleJoinAvailableDrivers
code = code.replace(
/handleJoinAvailableDrivers\([\s\S]*?\)\: \{ success\: boolean \} \{/g,
`handleJoinAvailableDrivers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { token?: string },
  ): { success: boolean; message?: string } {
    const user = this.extractUserFromSocket(client, data?.token);
    if (!user) {
      client.emit('error', { message: 'Authentication required' });
      return { success: false, message: 'Authentication required' };
    }
    
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const isDriver = user.role === 'DELIVERY_PARTNER';
    if (!isAdmin && !isDriver) {
      client.emit('error', { message: 'Unauthorized' });
      return { success: false, message: 'Unauthorized' };
    }`
);

fs.writeFileSync(filePath, code);
console.log('Fixed auth bypasses in orders.gateway.ts');
