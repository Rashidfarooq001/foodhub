import sys
import subprocess
import json

NODE_SCRIPT = '''
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const jobs = await prisma.deliveryJob.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { order: { select: { id: true, status: true, assignedFoodHubDriverId: true, assignedRestaurantDriverId: true } } }
  });
  console.log(JSON.stringify(jobs, null, 2));
}

run()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.(); });
'''

with open('apps/backend/script23.js', 'w', encoding='utf-8') as f:
    f.write(NODE_SCRIPT)

try:
    result = subprocess.run(['node', 'script23.js'], capture_output=True, text=True, cwd=r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\backend')
    print("OUTPUT:", result.stdout)
    if result.stderr:
        print("ERROR:", result.stderr)
except Exception as e:
    print("Failed to run node script:", e)
