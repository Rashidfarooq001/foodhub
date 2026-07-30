'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

interface PendingDriverApplication {
  id: string;
  licenseNumber: string;
  isApproved: boolean;
  user?: {
    phone?: string;
    email?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

export default function AdminDriverApprovalPage() {
  const [applications, setApplications] = useState<PendingDriverApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_BASE}/drivers/applications`);
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : []);
      }
    } catch { /* offline */ } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAction = async (id: string, isApproved: boolean) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('foodhub_admin_token') : null;
      const res = await fetch(`${API_BASE}/drivers/${id}/approval`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isApproved }),
      });
      if (res.ok) {
        fetchApplications();
      }
    } catch { /* offline */ }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">
          Courier Self-Registration Applications ({applications.length})
        </h1>
        <p className="text-xs text-gray-500">
          Verify driving licenses, vehicle RC records &amp; payout bank accounts before approving driver fleet access
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
            Loading courier onboarding applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
            No pending driver partner applications requiring review right now.
          </div>
        ) : (
          applications.map((app) => (
            <div key={app.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-col justify-between gap-2 border-b border-gray-100 pb-3 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-gray-900">
                      {app.user?.profile?.firstName} {app.user?.profile?.lastName || ''}
                    </h3>
                    <span className="rounded-full bg-amber-100 px-3 py-0.5 text-[10px] font-black text-amber-800">
                      PENDING VERIFICATION
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Phone: {app.user?.phone}</p>
                </div>
                <span className="text-xs font-bold text-gray-600">DL: {app.licenseNumber}</span>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-3">
                <button
                  onClick={() => handleAction(app.id, true)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve &amp; Activate Driver
                </button>
                <button
                  onClick={() => handleAction(app.id, false)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100"
                >
                  <XCircle className="h-4 w-4" /> Reject Driver
                </button>
                <button
                  onClick={() => alert('Request sent for updated Driving License & RC photo copies.')}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100"
                >
                  <HelpCircle className="h-4 w-4" /> Request More Info
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
