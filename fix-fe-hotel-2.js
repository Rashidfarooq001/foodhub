const fs = require('fs');
const path = require('path');
const file = path.join('apps', 'hotel-dashboard', 'src', 'app', 'orders', 'page.tsx');
let code = fs.readFileSync(file, 'utf8');

// 1. We replace `const fetchOrders = async () => { ... }` up to `const showToastError`
const fetchRegex = /const fetchOrders = async \(\) => \{[\s\S]*?const showToastError = /;

const newBlock = `const hasConnectedOnce = useRef(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const statusList = RESTAURANT_ORDER_FILTERS[filter].join(',');
      const res = await fetch(\`\${API_BASE}/orders?page=\${page}&limit=20&status=\${statusList}\`, {
        headers: accessToken ? { Authorization: \`Bearer \${accessToken}\` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        const rawList = Array.isArray(data) ? data : (data.orders ?? []);

        const formatted: OrderRecord[] = rawList.map((o: any) => {
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

          const itemsArr: OrderItem[] = (o.items || o.orderItems || []).map((i: any) => ({
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
              ? new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
              : '',
            customerName: o.customer?.profile
              ? \`\${o.customer.profile.firstName || ''} \${o.customer.profile.lastName || ''}\`.trim()
              : o.customerName || 'Customer',
            customerPhone: o.customer?.user?.phone || o.customerPhone || '',
            customerAddress: addrStr,
            deliveryAddress: o.deliveryAddress,
            deliveryInstructions: o.deliveryInstructions,
            distanceKm: o.deliveryJob?.distanceKm || o.distanceKm || undefined,
            driverName: driverObj?.user?.profile
              ? \`\${driverObj.user.profile.firstName} \${driverObj.user.profile.lastName || ''}\`.trim()
              : undefined,
            driverPhone: driverObj?.user?.phone,
            cancellationReason: o.cancellationReason,
            rejectionReason: o.rejectionReason,
            items: itemsArr,
          };
        });

        setOrders(formatted);
        
        if (data.totalPages !== undefined) {
          setTotalPages(data.totalPages || 1);
        }
      }
      
      const countsRes = await fetch(\`\${API_BASE}/orders/counts\`, {
        headers: accessToken ? { Authorization: \`Bearer \${accessToken}\` } : {},
      });
      if (countsRes.ok) {
        const counts = await countsRes.json();
        setCountsByStatus(counts || {});
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const socketUrl = API_BASE.replace('/api/v1', '');
    const socket = io(\`\${socketUrl}/orders\`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      if (restaurantId) {
        socket.emit('joinRestaurant', { restaurantId });
      }
      if (hasConnectedOnce.current) {
        fetchOrders();
      }
      hasConnectedOnce.current = true;
    });

    const handleRealtimeUpdate = () => {
      fetchOrders();
    };

    socket.on('order.created', handleRealtimeUpdate);
    socket.on('order.status_updated', handleRealtimeUpdate);

    return () => {
      socket.disconnect();
    };
  }, [accessToken, restaurantId, filter, page]);

  const showToastError = `;

code = code.replace(fetchRegex, newBlock);

fs.writeFileSync(file, code);
