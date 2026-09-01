import http from 'http';

interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  latenciesMs: number[];
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
}

async function runLoadTest(
  targetUrl: string,
  totalConcurrency = 50,
  requestsPerWorker = 10,
): Promise<LoadTestMetrics> {
  console.log(`🚀 Starting FoodHub Load Test Simulation...`);
  console.log(`Target: ${targetUrl}`);
  console.log(
    `Concurrency: ${totalConcurrency} workers | Requests per worker: ${requestsPerWorker}\n`,
  );

  const startTime = Date.now();
  const latencies: number[] = [];
  let successful = 0;
  let failed = 0;

  const workerPromises = Array.from({ length: totalConcurrency }).map(async (_, workerIdx) => {
    for (let i = 0; i < requestsPerWorker; i++) {
      const reqStart = Date.now();
      try {
        await new Promise<void>((resolve, reject) => {
          const req = http.get(targetUrl, (res) => {
            if (res.statusCode && res.statusCode < 400) {
              successful++;
              resolve();
            } else {
              failed++;
              resolve();
            }
          });
          req.on('error', () => {
            failed++;
            resolve();
          });
          req.setTimeout(5000, () => {
            req.destroy();
            failed++;
            resolve();
          });
        });
        latencies.push(Date.now() - reqStart);
      } catch {
        failed++;
      }
    }
  });

  await Promise.all(workerPromises);

  const durationSec = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const avgLatency =
    latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

  const p95Index = Math.floor(latencies.length * 0.95);
  const p99Index = Math.floor(latencies.length * 0.99);

  const p95 = latencies[p95Index] ?? 0;
  const p99 = latencies[p99Index] ?? 0;

  const metrics: LoadTestMetrics = {
    totalRequests: latencies.length,
    successfulRequests: successful,
    failedRequests: failed,
    latenciesMs: latencies,
    avgLatencyMs: avgLatency,
    p95LatencyMs: p95,
    p99LatencyMs: p99,
  };

  console.log(`📊 LOAD TEST RESULTS (Duration: ${durationSec.toFixed(2)}s)`);
  console.log(`-----------------------------------------------------`);
  console.log(`Total Requests Sent : ${metrics.totalRequests}`);
  console.log(`Successful (2xx/3xx): ${metrics.successfulRequests}`);
  console.log(`Failed / Timed out  : ${metrics.failedRequests}`);
  console.log(`Throughput          : ${(metrics.totalRequests / durationSec).toFixed(1)} req/sec`);
  console.log(`Average Latency     : ${metrics.avgLatencyMs} ms`);
  console.log(`p95 Latency         : ${metrics.p95LatencyMs} ms`);
  console.log(`p99 Latency         : ${metrics.p99LatencyMs} ms`);
  console.log(`-----------------------------------------------------\n`);

  return metrics;
}

// Execute local simulation test against health endpoint
if (require.main === module) {
  void runLoadTest('http://localhost:4000/health', 50, 10);
}
