const fs = require('fs');
let content = fs.readFileSync('apps/delivery-dashboard/src/app/page.tsx', 'utf8');

// Replace the generic error handler in fetchActiveJobs and fetchStatus to clear token on 401
const search = `} else {
              setLocationError(\`API Error: \${r.status} on active-jobs\`);
            }`;
const replace = `} else {
              if (r.status === 401) {
                 useDeliveryAuthStore.getState().logout();
                 window.location.href = '/login';
              }
              setLocationError(\`API Error: \${r.status} on active-jobs\`);
            }`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync('apps/delivery-dashboard/src/app/page.tsx', content, 'utf8');
  console.log('Fixed 401 handling for active jobs');
} else {
  console.log('Search string not found');
}
