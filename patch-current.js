const fs = require('fs');
const file = 'apps/delivery-dashboard/src/app/current-delivery/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const loadCurrentJob = async \(\) => \{[\s\S]*?catch \{[\s\S]*?setCurrentJob\(null\);[\s\S]*?\} finally \{/g,
`const loadCurrentJob = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(\`\${API_BASE}/delivery/active-jobs?_t=\${Date.now()}\`, {
        headers: {
          Authorization: \`Bearer \${accessToken}\`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        setError(\`API Error: \${res.status} \${res.statusText}\`);
        setCurrentJob(null);
        return;
      }

      const text = await res.text();
      try {
        const parsed = text ? JSON.parse(text) : null;
        const jobs = parsed?.data || parsed || [];
        
        if (Array.isArray(jobs) && jobs.length > 0) {
          if (targetJobId) {
            const found = jobs.find((j: any) => j.id === targetJobId);
            setCurrentJob(found || jobs[0]);
          } else {
            setCurrentJob(jobs[0]);
          }
        } else {
          setCurrentJob(null);
        }
      } catch (e: any) {
        setError(\`Parse Error: \${e.message}\`);
        setCurrentJob(null);
      }
    } catch (e: any) {
      setError(\`Network Error: \${e.message}. Base: \${API_BASE}\`);
      setCurrentJob(null);
    } finally {`
);

fs.writeFileSync(file, content);
