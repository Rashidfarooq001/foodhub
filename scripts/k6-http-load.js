/**
 * ZaykaFood K6 Load Test Suite — Staging
 *
 * Runs a realistic mixed workload against the staging load balancer.
 * All security controls remain active (JWT, RBAC, rate limiting).
 *
 * Usage:
 *   k6 run --env BASE_URL=http://staging.zaykafood.local \
 *           --env JWT_TOKEN=<valid_staging_jwt> \
 *           k6-http-load.js
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:80';
const JWT_TOKEN = __ENV.JWT_TOKEN || '';
const DRIVER_JWT = __ENV.DRIVER_JWT || '';

// ─── Custom metrics ──────────────────────────────────────────────────────────
const socketConnectSuccessRate = new Rate('socket_connect_success');
const socketMsgLatency = new Trend('socket_msg_latency_ms');
const gpsUpdatesSent = new Counter('gps_updates_sent');
const authErrors = new Counter('auth_errors');

// ─── Stage configuration ─────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // HTTP REST workload: 40% reads, 20% menus, 15% orders, 10% auth, 10% tracking, 5% misc
    http_workload: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },   // ramp to 100 VUs (100 RPS approx)
        { duration: '2m', target: 500 },   // ramp to 500 RPS
        { duration: '2m', target: 1000 },  // ramp to 1,000 RPS
        { duration: '2m', target: 1500 },  // ramp to 1,500 RPS — watch for degradation
        { duration: '2m', target: 2000 },  // ramp to 2,000 RPS
        { duration: '1m', target: 0 },     // ramp down
      ],
      gracefulRampDown: '30s',
      exec: 'httpWorkload',
    },

    // Socket.IO workload: progressive connection scaling
    socket_connections: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 1000 },   // 1K sockets
        { duration: '2m', target: 2500 },   // 2.5K
        { duration: '2m', target: 5000 },   // 5K
        { duration: '2m', target: 10000 },  // 10K
        { duration: '2m', target: 25000 },  // 25K — likely CPU-bound threshold
        { duration: '2m', target: 0 },      // ramp down
      ],
      gracefulRampDown: '30s',
      exec: 'socketWorkload',
    },
  },

  thresholds: {
    // HTTP thresholds — SAFE SUSTAINABLE definition
    http_req_duration: [
      'p(50)<200',   // p50 must be < 200ms
      'p(95)<1000',  // p95 must be < 1s
      'p(99)<3000',  // p99 must be < 3s
    ],
    http_req_failed: ['rate<0.01'],          // < 1% error rate
    socket_connect_success: ['rate>0.98'],   // > 98% socket connect success
    auth_errors: ['count<10'],               // near-zero auth failures
  },
};

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${JWT_TOKEN}`,
};

// ─── HTTP Workload ────────────────────────────────────────────────────────────
export function httpWorkload() {
  const rand = Math.random();

  if (rand < 0.40) {
    // 40% — restaurant discovery reads
    const res = http.get(`${BASE_URL}/api/v1/restaurants?lat=34.08&lng=74.79&radius=5`, { headers });
    check(res, { 'restaurant list 200': (r) => r.status === 200 });

  } else if (rand < 0.60) {
    // 20% — menu reads
    const res = http.get(`${BASE_URL}/api/v1/restaurants/menu?restaurantId=test-id`, { headers });
    check(res, { 'menu 200 or 404': (r) => r.status === 200 || r.status === 404 });

  } else if (rand < 0.75) {
    // 15% — order history + status
    const res = http.get(`${BASE_URL}/api/v1/orders/history?page=1&limit=20`, { headers });
    check(res, { 'order history 200': (r) => r.status === 200 || r.status === 401 });
    if (res.status === 401) authErrors.add(1);

  } else if (rand < 0.85) {
    // 10% — order tracking snapshot (REST fallback)
    const res = http.get(`${BASE_URL}/api/v1/orders/test-order-id/tracking`, { headers });
    check(res, { 'tracking 200 or 404': (r) => r.status === 200 || r.status === 404 });

  } else if (rand < 0.95) {
    // 10% — health check (simulates infra probes)
    const res = http.get(`${BASE_URL}/api/v1/health`);
    check(res, { 'health 200': (r) => r.status === 200 });

  } else {
    // 5% — coupon lookup
    const res = http.get(`${BASE_URL}/api/v1/coupons/available`, { headers });
    check(res, { 'coupons 200 or 401': (r) => r.status === 200 || r.status === 401 });
  }

  sleep(Math.random() * 0.5 + 0.1); // 100-600ms think time
}

// ─── Socket.IO Workload ──────────────────────────────────────────────────────
// NOTE: k6 does not natively support Socket.IO (it's custom protocol over WS).
// This uses raw WebSocket to the polling endpoint as a connection stress test.
// For full Socket.IO event testing, use the separate socket-bench.js script.
export function socketWorkload() {
  const url = `ws://${BASE_URL.replace('http://', '')}/socket.io/?EIO=4&transport=websocket`;

  const connectStart = Date.now();
  const res = ws.connect(url, {}, function (socket) {
    const latency = Date.now() - connectStart;
    socketConnectSuccessRate.add(true);
    socketMsgLatency.add(latency);

    // Send Socket.IO handshake
    socket.send('40');

    // Simulate GPS update from a rider
    socket.on('message', (data) => {
      if (data.startsWith('0')) {
        // Connected — join order room
        const joinMsg = `42["joinOrder",{"orderId":"test-order","token":"${DRIVER_JWT}"}]`;
        socket.send(joinMsg);
        gpsUpdatesSent.add(1);
      }
    });

    // Hold connection for realistic soak
    sleep(120); // hold for 2 minutes
    socket.close();
  });

  check(res, { 'socket connected': (r) => r && r.status === 101 });
  if (!res || res.status !== 101) {
    socketConnectSuccessRate.add(false);
  }
}
