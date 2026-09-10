/**
 * ZaykaFood — Real Socket.IO Tracking Bench
 *
 * Uses socket.io-client (NOT raw WebSocket) for accurate protocol compliance.
 * Simulates the actual driver → Redis → Socket.IO → customer fan-out path.
 *
 * Prerequisites:
 *   npm install socket.io-client
 *
 * Usage:
 *   node scripts/socket-bench.js \
 *     --url http://localhost:80 \
 *     --riders 100 \
 *     --customers 200 \
 *     --driver-jwt "<JWT>" \
 *     --customer-jwt "<JWT>" \
 *     --duration 300
 *
 * Reports at 10s, 30s, 60s, 120s, 180s, 240s, 300s (soak markers).
 */

const { io } = require('socket.io-client');
const { program } = require('commander');

program
  .option('--url <url>', 'Base URL', 'http://localhost:80')
  .option('--riders <n>', 'Number of simulated riders', '100')
  .option('--customers <n>', 'Number of simulated customers per rider', '2')
  .option('--driver-jwt <jwt>', 'Driver JWT token', '')
  .option('--customer-jwt <jwt>', 'Customer JWT token', '')
  .option('--duration <secs>', 'Test duration in seconds', '60')
  .option('--gps-interval <ms>', 'GPS update interval per rider (ms)', '1000')
  .parse();

const opts = program.opts();
const URL = opts.url;
const NUM_RIDERS = parseInt(opts.riders);
const NUM_CUSTOMERS = parseInt(opts.customers);
const DURATION_MS = parseInt(opts.duration) * 1000;
const GPS_INTERVAL = parseInt(opts.gpsInterval);

// ─── Metrics ─────────────────────────────────────────────────────────────────
let stats = {
  riderConnected: 0,
  customerConnected: 0,
  connectErrors: 0,
  gpsSent: 0,
  gpsReceived: 0,
  authRejections: 0,
  disconnects: 0,
  reconnects: 0,
  latencies: [],
};

function snapshot(label) {
  const mem = process.memoryUsage();
  const p50 = percentile(stats.latencies, 50);
  const p95 = percentile(stats.latencies, 95);
  const p99 = percentile(stats.latencies, 99);
  console.log(`\n[${label}]`);
  console.log(`  Rider Sockets: ${stats.riderConnected}/${NUM_RIDERS}`);
  console.log(`  Customer Sockets: ${stats.customerConnected}/${NUM_RIDERS * NUM_CUSTOMERS}`);
  console.log(`  Connect Errors: ${stats.connectErrors}`);
  console.log(`  Auth Rejections: ${stats.authRejections}`);
  console.log(`  GPS Updates Sent: ${stats.gpsSent}`);
  console.log(`  GPS Updates Received: ${stats.gpsReceived}`);
  console.log(`  Delivery Rate: ${stats.gpsSent > 0 ? ((stats.gpsReceived / stats.gpsSent) * 100).toFixed(1) : 0}%`);
  console.log(`  Latency p50: ${p50}ms  p95: ${p95}ms  p99: ${p99}ms`);
  console.log(`  Disconnects: ${stats.disconnects}  Reconnects: ${stats.reconnects}`);
  console.log(`  RSS: ${(mem.rss / 1024 / 1024).toFixed(1)}MB  Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB`);
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor((p / 100) * sorted.length)] || 0;
}

// ─── Connect rider sockets ─────────────────────────────────────────────────
async function runBench() {
  console.log(`\n=== ZaykaFood Socket.IO Tracking Bench ===`);
  console.log(`URL: ${URL} | Riders: ${NUM_RIDERS} | Customers/Rider: ${NUM_CUSTOMERS}`);
  console.log(`GPS Interval: ${GPS_INTERVAL}ms | Duration: ${opts.duration}s\n`);

  const TEST_ORDER_ID = 'bench-order-001';
  const RIDER_LAT_BASE = 34.0836;
  const RIDER_LNG_BASE = 74.7973;

  // Start snapshot reporter at soak intervals
  const soakTimes = [10, 30, 60, 120, 180, 240, 300].filter(s => s * 1000 <= DURATION_MS);
  soakTimes.forEach(s => {
    setTimeout(() => snapshot(`T+${s}s`), s * 1000);
  });

  // Connect customers first
  const customerSockets = [];
  for (let c = 0; c < NUM_RIDERS * NUM_CUSTOMERS; c++) {
    const sock = io(`${URL}/orders`, {
      transports: ['websocket'],
      auth: { token: opts.customerJwt },
      reconnection: true,
      reconnectionDelay: 1000,
    });

    sock.on('connect', () => {
      stats.customerConnected++;
      sock.emit('joinOrder', { orderId: TEST_ORDER_ID, token: opts.customerJwt });
    });

    sock.on('connect_error', (err) => {
      if (err.message?.includes('Unauthorized') || err.message?.includes('authentication')) {
        stats.authRejections++;
      } else {
        stats.connectErrors++;
      }
    });

    sock.on('disconnect', () => stats.disconnects++);
    sock.on('reconnect', () => stats.reconnects++);

    // Track GPS delivery latency
    sock.on('driverLocation', (data) => {
      stats.gpsReceived++;
      if (data._sentAt) {
        stats.latencies.push(Date.now() - data._sentAt);
        // Keep only last 10,000 latency samples
        if (stats.latencies.length > 10000) stats.latencies.shift();
      }
    });

    customerSockets.push(sock);
    // Stagger connections 5ms each to avoid thundering herd
    await new Promise(r => setTimeout(r, 5));
  }

  // Connect riders and start GPS updates
  const riderSockets = [];
  const gpsIntervals = [];

  for (let r = 0; r < NUM_RIDERS; r++) {
    const sock = io(`${URL}/orders`, {
      transports: ['websocket'],
      auth: { token: opts.driverJwt },
      reconnection: true,
      reconnectionDelay: 1000,
    });

    sock.on('connect', () => {
      stats.riderConnected++;

      // Start GPS emission after connecting
      let tick = 0;
      const interval = setInterval(() => {
        if (!sock.connected) return;
        const lat = RIDER_LAT_BASE + (Math.random() - 0.5) * 0.01;
        const lng = RIDER_LNG_BASE + (Math.random() - 0.5) * 0.01;
        sock.emit('updateLocation', {
          orderId: TEST_ORDER_ID,
          lat,
          lng,
          token: opts.driverJwt,
          _sentAt: Date.now(),
        });
        stats.gpsSent++;
        tick++;
      }, GPS_INTERVAL);

      gpsIntervals.push(interval);
    });

    sock.on('connect_error', (err) => {
      if (err.message?.includes('Unauthorized')) {
        stats.authRejections++;
      } else {
        stats.connectErrors++;
      }
    });

    sock.on('disconnect', () => stats.disconnects++);
    sock.on('reconnect', () => stats.reconnects++);

    riderSockets.push(sock);
    await new Promise(r => setTimeout(r, 10));
  }

  // Wait for test duration
  await new Promise(r => setTimeout(r, DURATION_MS));

  // Cleanup
  gpsIntervals.forEach(i => clearInterval(i));
  [...riderSockets, ...customerSockets].forEach(s => s.disconnect());

  snapshot('FINAL');
  process.exit(0);
}

runBench().catch(err => {
  console.error('Bench error:', err);
  process.exit(1);
});
