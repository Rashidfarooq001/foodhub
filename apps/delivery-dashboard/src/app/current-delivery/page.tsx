'use client';

import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ActiveJobCard from '../../components/ActiveJobCard';

const API_BASE = getApiBaseUrl();

export default function CurrentDeliveryPage() {
  const router = useRouter();
  const { accessToken } = useDeliveryAuthStore();
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCurrentJobs = async () => {
    if (!accessToken) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/delivery/active-jobs?_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        cache: 'no-store',
      });
      if (res.ok) {
        const text = await res.text();
        const parsed = JSON.parse(text);
        setActiveJobs(parsed?.data || parsed || []);
      }
    } catch (e) {
    } finally { setLoading(false); }
  };

  useEffect(() => { loadCurrentJobs(); }, [accessToken]);

  if (loading) return <div className="py-16 text-center text-xs font-bold">Loading...</div>;

  if (!activeJobs || activeJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-black">No Active Delivery</h2>
        <button onClick={() => router.push('/')} className="mt-4 bg-orange-600 px-6 py-2.5 text-white font-bold rounded-xl">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <h2 className="text-lg font-black px-2">Active Deliveries ({activeJobs.length})</h2>
      {activeJobs.map(job => <ActiveJobCard key={job.id} job={job} onReload={loadCurrentJobs} />)}
    </div>
  );
}
