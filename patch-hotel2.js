const fs = require('fs');
const file = 'apps/hotel-dashboard/src/app/orders/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `  useEffect(() => {
    fetchOrders();

    const socketUrl = API_BASE.replace('/api/v1', '');
    const socket = io(\`\${socketUrl}/orders\`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      if (restaurantId) {
        socket.emit('joinRestaurant', { restaurantId });
      }
      fetchOrders();
    });`;

const replacement = `  const hasConnectedOnce = useRef(false);

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
    });`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
