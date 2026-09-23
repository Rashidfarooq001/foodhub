const http = require('http');

const API_BASE = 'http://localhost:3001/api/v1';

async function run() {
  console.log('Starting load test...');
  let reqs = 0;
  let errors = 0;
  const start = Date.now();
  
  const hit = () => new Promise((resolve) => {
    const req = http.get(${API_BASE}/health, (res) => {
      res.on('data', () => {});
      res.on('end', () => { reqs++; resolve(); });
    });
    req.on('error', (e) => { errors++; resolve(); });
    req.setTimeout(5000, () => { req.destroy(); errors++; resolve(); });
  });
  
  const concurrent = 100;
  let running = true;
  
  const timer = setInterval(() => {
    console.log(Requests: , Errors: , RPS: );
  }, 1000);
  
  setTimeout(() => { running = false; clearInterval(timer); }, 15000);
  
  while (running) {
    const batch = [];
    for(let i=0; i<concurrent; i++) batch.push(hit());
    await Promise.all(batch);
  }
  console.log('Done!');
}
run();
