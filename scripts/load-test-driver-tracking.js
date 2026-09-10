const autocannon = require('autocannon');
const fs = require('fs');
const http = require('http');

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:4000';
const ORDER_ID = process.env.ORDER_ID || '24b2b2a7-14da-44b6-90ee-21e5e8bd9007';
const JWT = process.env.TEST_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYThkMGEwMi0xNWQ0LTRlZTAtYjFjZi05MDNhZWY1NDI3NjYiLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3ODkwMTU5OTYsImV4cCI6MTc4OTAxOTU5Nn0.hgIJv0wH_2y8iPoReoh5FhZ8tcFVz6fgvKG4LMs_n5E';

const DURATION = 10;
const STAGES = [100, 500, 1000, 2500, 5000, 10000, 20000];
// To simulate realistic 1 request per 5 seconds polling per client:
// Autocannon without throttling goes as fast as the server can handle. 
// We will limit autocannon's overall rate to (Concurrency / 5) requests per second.
// Wait, autocannon's `connectionRate` simulates new connections/sec. `amount` simulates total requests.

async function getHealth() {
  return new Promise((resolve) => {
    http.get(`${TARGET_URL}/api/v1/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) { resolve({}); }
      });
    }).on('error', () => resolve({}));
  });
}

async function runStage(concurrency) {
  console.log(`\n--- Running Stage: ${concurrency} connections ---`);
  const baseHealth = await getHealth();
  const baseMem = baseHealth.memory || {};
  const baseCpu = baseHealth.cpu || {};

  return new Promise((resolve) => {
    const instance = autocannon({
      url: `${TARGET_URL}/api/v1/orders/${ORDER_ID}/tracking`,
      connections: concurrency,
      duration: DURATION,
      headers: {
        Authorization: `Bearer ${JWT}`
      }
    }, async (err, result) => {
      if (err) {
        console.error("Autocannon error:", err);
      }
      const postHealth = await getHealth();
      const postMem = postHealth.memory || {};
      
      resolve({ result, baseMem, postMem, baseCpu });
    });
    
    // We can also poll memory during the test, but health endpoint might be overloaded.
  });
}

async function run() {
  const results = [];
  
  for (const c of STAGES) {
    const { result, baseMem, postMem } = await runStage(c);
    if (!result) continue;
    
    results.push({
      concurrency: c,
      reqPerSec: result.requests.average,
      p50: result.latency.p50,
      p95: result.latency.p95,
      p99: result.latency.p99,
      errors: result.errors,
      timeouts: result.timeouts,
      baseRss: baseMem.rssMb,
      postRss: postMem.rssMb,
      baseHeap: baseMem.heapUsedMb,
      postHeap: postMem.heapUsedMb
    });
    
    console.log(`Result: ${result.requests.average} req/s | p95: ${result.latency.p95}ms | Errors: ${result.errors} | RSS: ${baseMem.rssMb}MB -> ${postMem.rssMb}MB`);
    
    // Stop condition
    if (result.errors > (result.requests.total * 0.2) || result.timeouts > 100) {
      console.log("STOP CONDITION MET: Excessive errors/timeouts. Halting escalation.");
      break;
    }
    
    // Wait for 5 seconds between stages for recovery
    await new Promise(r => setTimeout(r, 5000));
  }
  
  fs.writeFileSync('load-test-results.json', JSON.stringify(results, null, 2));
  console.log("Saved results to load-test-results.json");
}

run().catch(console.error);
