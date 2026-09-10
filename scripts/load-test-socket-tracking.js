const { io } = require("socket.io-client");
const fs = require('fs');

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:4000';
const ORDER_ID = process.env.ORDER_ID || '24b2b2a7-14da-44b6-90ee-21e5e8bd9007';
const JWT = process.env.TEST_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYThkMGEwMi0xNWQ0LTRlZTAtYjFjZi05MDNhZWY1NDI3NjYiLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3ODkwMTU5OTYsImV4cCI6MTc4OTAxOTU5Nn0.hgIJv0wH_2y8iPoReoh5FhZ8tcFVz6fgvKG4LMs_n5E';

const STAGES = [1000, 5000];

async function runStage(concurrency) {
  console.log(`\n--- Running Socket Stage: ${concurrency} connections ---`);
  
  const clients = [];
  let connectionPromises = [];

  // Initialize clients
  for (let i = 0; i < concurrency; i++) {
    const client = io(TARGET_URL, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client);
    
    connectionPromises.push(new Promise((resolve) => {
      client.on("connect", () => resolve(true));
      client.on("connect_error", () => resolve(false));
    }));
  }

  const connectionResults = await Promise.all(connectionPromises);
  const connectedCount = connectionResults.filter(Boolean).length;
  console.log(`Successfully connected ${connectedCount}/${concurrency} sockets`);

  if (connectedCount === 0) {
      clients.forEach(c => c.disconnect());
      return { success: false };
  }

  // authenticate & join room
  let updatesReceived = 0;
  for (const client of clients) {
    if (client.connected) {
      client.emit('joinOrder', { orderId: ORDER_ID, token: JWT });
      client.on('driverLocationUpdate', () => {
        updatesReceived++;
      });
    }
  }

  // Let them listen for 5 seconds
  await new Promise(r => setTimeout(r, 5000));
  
  console.log(`Total broadcast updates received across all clients in 5s: ${updatesReceived}`);

  // Disconnect all
  clients.forEach(c => c.disconnect());
  
  return { connectedCount, updatesReceived };
}

async function run() {
  for (const c of STAGES) {
    const res = await runStage(c);
    if (!res || res.connectedCount < (c * 0.8)) {
      console.log("Too many failed connections, halting escalation.");
      break;
    }
    await new Promise(r => setTimeout(r, 3000));
  }
}
run().catch(console.error);
