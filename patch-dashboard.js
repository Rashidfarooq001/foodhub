const fs = require('fs');
const file = 'apps/delivery-dashboard/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('setLocationError(`API Error')) {
  content = content.replace(
    /const fetchActiveJobs = fetch\([\s\S]*?\.catch\(console\.error\);/g,
    `const fetchActiveJobs = fetch(\`\${API_BASE}/delivery/active-jobs?_t=\${Date.now()}\`, { headers, cache: 'no-store' })
          .then(async r => {
            if (r.ok) {
              const text = await r.text();
              try {
                const parsed = text ? JSON.parse(text) : null;
                const jobsPayload = parsed?.data || parsed || [];
                setActiveDeliveries(Array.isArray(jobsPayload) ? jobsPayload : []);
              } catch (e) {
                setLocationError(\`Parse Error: \${e.message}\`);
              }
            } else {
              setLocationError(\`API Error: \${r.status} on active-jobs\`);
            }
          }).catch(e => {
            setLocationError(\`Network Error: \${e.message}\`);
          });`
  );
  fs.writeFileSync(file, content);
}
