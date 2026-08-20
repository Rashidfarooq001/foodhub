'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, MapPin, Bike, RefreshCw, ArrowRight } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { useActiveDeliveryStore } from '../../stores/use-active-delivery-store';

const API_BASE = getApiBaseUrl();

export default function AvailableOrdersPage() {
  const router = useRouter();
  const { accessToken } = useDeliveryAuthStore();
  const { acceptNewJob } = useActiveDeliveryStore();

  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      let res = await fetch(`${API_BASE}/delivery/jobs/available`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!res.ok) {
        res = await fetch(`${API_BASE}/delivery/available`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
      }
      if (res.ok) {
        const data = await res.json();
        setAvailableJobs(Array.isArray(data) ? data : data.jobs ?? []);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [accessToken]);

  const handleAccept = async (job: any) => {
    if (!accessToken) return;
    setAcceptingId(job.id);
    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${job.id}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        alert('Unable to accept delivery job. It may have been claimed by another rider.');
        await fetchJobs();
        return;
      }

      acceptNewJob({
        ...job,
        status: 'DRIVER_ASSIGNED',
      });

      router.push('/current-delivery');
    } catch {
      alert('Network error accepting delivery.');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Available Delivery Orders
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Live orders ready for pickup in your local dispatch zone
          </p>
        </div>

        <button
          onClick={fetchJobs}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Jobs</span>
        </button>
      </div>

      {/* Jobs Stream */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          Available Jobs ({availableJobs.length})
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400">Searching for orders nearby...</div>
        ) : availableJobs.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6 space-y-2">
            <Bike className="h-8 w-8 mx-auto text-gray-300 mb-1" />
            <p className="font-bold text-gray-700">No active delivery jobs available right now.</p>
            <p className="text-[10px] text-gray-400">Keep your app on duty and stay in popular restaurant zones.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {availableJobs.map((job) => {
              const isAccepting = acceptingId === job.id;
              return (
                <div
                  key={job.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3 flex flex-col justify-between hover:border-emerald-300 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-black text-gray-900">
                        #{job.orderNumber || job.id.slice(0, 8)}
                      </span>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                        Payout: ₹{job.estimatedEarnings || job.deliveryFee || 65}
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 text-gray-700">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold block uppercase">Pickup Restaurant</span>
                          <span className="font-bold text-gray-900">{job.restaurantName || 'Restaurant Kitchen'}</span>
                          <span className="text-[11px] text-gray-500 block truncate">{job.restaurantAddress}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold block uppercase">Customer Drop</span>
                          <span className="font-bold text-gray-900">{job.customerName || 'Customer'}</span>
                          <span className="text-[11px] text-gray-500 block truncate">{job.customerAddress}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-gray-500">
                      Distance: {job.distanceKm || '3.5'} km
                    </span>

                    <button
                      onClick={() => handleAccept(job)}
                      disabled={isAccepting}
                      className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 transition min-h-[44px]"
                    >
                      <span>{isAccepting ? 'Claiming...' : 'ACCEPT JOB'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
