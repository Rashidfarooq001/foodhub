'use client';

import React, { useState, useEffect } from 'react';
import { DeliveryJob } from '../../data/delivery-mock-data';
import { useActiveDeliveryStore } from '../../stores/use-active-delivery-store';
import { useRouter } from 'next/navigation';
import { DollarSign, MapPin } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AvailableOrdersPage() {
  const router = useRouter();
  const { acceptNewJob } = useActiveDeliveryStore();

  const [availableJobs, setAvailableJobs] = useState<DeliveryJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/delivery/available`);
        if (res.ok) {
          const data = await res.json();
          setAvailableJobs(Array.isArray(data) ? data : data.jobs ?? []);
        }
      } catch {
        // Backend offline
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleDecline = (jobId: string) => {
    setAvailableJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Available Nearby Orders {isLoading ? '' : `(${availableJobs.length})`}</h1>
        <p className="text-xs text-gray-500">Dispatch requests near your current GPS location</p>
      </div>

      {availableJobs.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center space-y-3">
          <p className="text-base font-bold text-gray-800">No available orders nearby</p>
          <p className="text-xs text-gray-500">New delivery requests will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {availableJobs.map((job) => (
            <div key={job.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-black text-gray-900">{job.orderNumber}</span>
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                  <DollarSign className="h-3.5 w-3.5" /> ₹{job.estimatedEarnings} Payout
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-bold text-gray-900 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-orange-600 shrink-0" /> Pickup: {job.restaurantName} ({job.restaurantAddress})
                </p>
                <p className="font-bold text-gray-900 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0" /> Drop: {job.customerName} ({job.customerAddress})
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span>Est. Distance: {job.distanceKm} km</span>
                <span>Est. Time: ~{job.estimatedTimeMins} mins</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    acceptNewJob(job);
                    router.push('/current-delivery');
                  }}
                  className="flex-1 rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
                >
                  Accept Order
                </button>
                <button
                  onClick={() => handleDecline(job.id)}
                  className="rounded-2xl border border-rose-200 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
