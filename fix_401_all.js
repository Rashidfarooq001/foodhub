const fs = require('fs');
let content = fs.readFileSync('apps/delivery-dashboard/src/app/page.tsx', 'utf8');

const replacement = `
          // Check for 401 Unauthorized across any of the parallel requests
          const handle401 = (r: Response) => {
            if (r.status === 401) {
              const { logout } = useDeliveryAuthStore.getState();
              logout();
              window.location.href = '/login';
            }
          };

          const fetchStats = fetch(\`\${API_BASE}/delivery/stats?_t=\${Date.now()}\`, { headers, cache: 'no-store' })
            .then(async r => {
              handle401(r);
              if (r.ok) {
                const text = await r.text();
                if (text) setStats(JSON.parse(text));
              }
            }).catch(console.error);

          const fetchActiveJobs = fetch(\`\${API_BASE}/delivery/active-jobs?_t=\${Date.now()}\`, { headers, cache: 'no-store' })
            .then(async r => {
              handle401(r);
              if (r.ok) {
                const text = await r.text();
                try {
                  const parsed = text ? JSON.parse(text) : null;
                  const jobsPayload = parsed?.data || parsed || [];
                  setActiveDeliveries(Array.isArray(jobsPayload) ? jobsPayload : []);
                } catch (e: any) {
                  setLocationError(\`Parse Error: \${e.message}\`);
                }
              } else {
                setLocationError(\`API Error: \${r.status} on active-jobs\`);
              }
            }).catch((e: any) => {
              setLocationError(\`Network Error: \${e.message}\`);
            });

          const fetchAvailableJobs = fetch(\`\${API_BASE}/delivery/jobs/available?_t=\${Date.now()}\`, { headers, cache: 'no-store' })
            .then(async r => {
              handle401(r);
              if (r.ok) {
                const text = await r.text();
                try {
                  const parsed = text ? JSON.parse(text) : null;
                  const jobsPayload = parsed?.data || parsed || [];
                  setAvailableJobs(Array.isArray(jobsPayload) ? jobsPayload : []);
                } catch (e: any) {
                  console.error("Parse Error on available jobs:", e);
                }
              }
            }).catch(console.error);

          const fetchStatus = fetch(\`\${API_BASE}/delivery/me/status?_t=\${Date.now()}\`, { headers, cache: 'no-store' })
            .then(async r => {
              handle401(r);
              if (r.ok) {
                const text = await r.text();
                if (text) {
                  const data = JSON.parse(text);
                  setIsOnDuty(data.dutyStatus === 'ONLINE' || data.operationalStatus === 'ONLINE');
                }
              }
            }).catch(console.error);
`;

// Replace the entire try block inside fetchDashboardData
const searchStart = `const fetchStats = fetch(\`\${API_BASE}/delivery/stats?_t=\${Date.now()}\`, { headers, cache: 'no-store' })`;
const searchEnd = `await Promise.all([fetchStats, fetchActiveJobs, fetchAvailableJobs, fetchStatus]);`;

const startIndex = content.indexOf(searchStart);
const endIndex = content.indexOf(searchEnd);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('apps/delivery-dashboard/src/app/page.tsx', content, 'utf8');
  console.log('Successfully updated page.tsx to handle 401s');
} else {
  console.log('Could not find the fetch block');
}
