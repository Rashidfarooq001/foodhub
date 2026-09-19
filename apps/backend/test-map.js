require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testMap() {
  const token = jwt.sign(
    { sub: '05652576-b443-459b-aca4-7fbed63f2bed', phone: '+917006298795', role: 'SUPER_ADMIN', restaurantId: 'efcc61f1-7314-47a3-888e-aa14c1894c10' },
    process.env.JWT_SECRET || 'zayka-super-secret-key-2026',
    { expiresIn: '1d' }
  );

  const r = await fetch('https://api.zaykafood.online/api/v1/orders', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const data = await r.json();
  const rawList = Array.isArray(data) ? data : (data.orders ?? []);
  console.log('Mapping', rawList.length, 'orders');

  try {
    const formatted = rawList.map((o) => {
      let addrStr = 'Address not available';
      if (o.deliveryAddress) {
        if (typeof o.deliveryAddress === 'string') {
          addrStr = o.deliveryAddress;
        } else {
          const a = o.deliveryAddress;
          const parts = [
            a.addressLine1 || a.street,
            a.addressLine2,
            a.landmark,
            a.city,
            a.state,
            a.postalCode,
          ].filter(Boolean);
          addrStr = parts.length > 0 ? parts.join(', ') : a.label || 'Customer Location';
        }
      }

      const itemsArr = (o.items || o.orderItems || []).map((i) => ({
        id: i.id,
        name: i.foodItem?.name || i.name || 'Food Item',
        quantity: i.quantity || 1,
        price: Number(i.unitPrice || i.price || 0),
        variant:
          i.variantName ||
          i.variant ||
          (i.selectedVariant ? i.selectedVariant.name : undefined),
        notes: i.instructions || i.notes,
        addons: i.addons,
      }));

      const driverObj = o.assignedFoodHubDriver || o.deliveryJob?.driver;

      return {
        id: o.id,
        orderNumber: o.orderNumber || o.id.substring(0, 8),
        status: o.status,
        subtotal: Number(o.subtotal || 0),
        taxAmount: Number(o.taxAmount || 0),
        deliveryFee: Number(o.deliveryFee || 0),
        totalAmount: Number(o.totalAmount || 0),
        paymentMethod: o.paymentMethod || 'COD',
        paymentStatus: o.paymentStatus || 'PENDING',
        createdAt: o.createdAt || new Date().toISOString(),
        placedAt: o.createdAt
          ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
        customerName: o.customer?.profile
          ? \\ \\.trim()
          : o.customerName || 'Customer',
        customerPhone: o.customer?.user?.phone || o.customerPhone || '',
        customerAddress: addrStr,
        deliveryAddress: o.deliveryAddress,
        deliveryInstructions: o.deliveryInstructions,
        distanceKm: o.deliveryJob?.distanceKm || o.distanceKm || undefined,
        driverName: driverObj?.user?.profile
          ? \\ \\.trim()
          : undefined,
        driverPhone: driverObj?.user?.phone,
        cancellationReason: o.cancellationReason,
        rejectionReason: o.rejectionReason,
        deliveryJob: o.deliveryJob,
        items: itemsArr,
      };
    });
    console.log('SUCCESS, formatted length:', formatted.length);
  } catch(e) {
    console.log('ERROR:', e.message);
  }
}

testMap();
