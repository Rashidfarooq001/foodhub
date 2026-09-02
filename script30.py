import re

filepath = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\delivery-dashboard\src\app\current-delivery\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useSearchParams import
content = content.replace(
    "import { io } from 'socket.io-client';",
    "import { io } from 'socket.io-client';\nimport { useSearchParams, useRouter } from 'next/navigation';"
)

# Extract searchParams inside the component
content = content.replace(
    'export default function CurrentDeliveryPage() {',
    'export default function CurrentDeliveryPage() {\n  const searchParams = useSearchParams();\n  const router = useRouter();\n  const targetJobId = searchParams.get(\'jobId\');'
)

# Change fetch to active-jobs
old_fetch_block = '''    try {
      const res = await fetch(${API_BASE}/delivery/current?_t=, {
        headers: {
          Authorization: Bearer ,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        setCurrentJob(null);
        return;
      }

      const text = await res.text();
      try {
        const parsed = text ? JSON.parse(text) : null;
        setCurrentJob(parsed?.data || parsed);
      } catch {
        setCurrentJob(null);
      }'''

new_fetch_block = '''    try {
      const res = await fetch(${API_BASE}/delivery/active-jobs?_t=, {
        headers: {
          Authorization: Bearer ,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
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
      } catch {
        setCurrentJob(null);
      }'''

content = content.replace(old_fetch_block, new_fetch_block)

# Add fallback when there's no job
# Let's check how it handles if !currentJob
old_no_job = '''  if (!currentJob) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 space-y-4">
        <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900">No Active Delivery</h2>
        <p className="text-sm font-bold text-gray-500 max-w-xs">
          You are not currently assigned to any delivery job.
        </p>
      </div>
    );
  }'''

new_no_job = '''  if (!currentJob) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 space-y-4">
        <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900">No Active Delivery</h2>
        <p className="text-sm font-bold text-gray-500 max-w-xs">
          You are not currently assigned to any delivery job.
        </p>
        <button onClick={() => router.push('/')} className="mt-4 rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-black text-white hover:bg-orange-700">
          Back to Dashboard
        </button>
      </div>
    );
  }'''

content = content.replace(old_no_job, new_no_job)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated current-delivery/page.tsx")
