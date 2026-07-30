'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

interface PendingApplication {
  id: string;
  name: string;
  phone: string;
  email?: string;
  addressLine: string;
  licenseFssai: string;
  gstin?: string;
  status: string;
  createdAt: string;
}

export default function AdminRestaurantApprovalPage() {
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/restaurants`);
      if (res.ok) {
        const data = await res.json();
        const all: PendingApplication[] = Array.isArray(data) ? data : [];
        setApplications(all.filter((a) => a.status === 'PENDING_APPROVAL' || a.status === 'PENDING'));
      }
    } catch { /* offline */ } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING') => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('foodhub_admin_token') : null;
      const res = await fetch(`${API_BASE}/api/v1/restaurants/${id}/approval`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
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
          Restaurant Self-Registration Applications ({applications.length})
        </h1>
        <p className="text-xs text-gray-500">
          Verify merchant FSSAI licenses, address details &amp; bank accounts before approving store activation
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
            Loading restaurant onboarding applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
            No pending restaurant applications requiring review right now.
          </div>
        ) : (
          applications.map((app) => (
            <div key={app.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-col justify-between gap-2 border-b border-gray-100 pb-3 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-gray-900">{app.name}</h3>
                    <span className="rounded-full bg-amber-100 px-3 py-0.5 text-[10px] font-black text-amber-800">
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{app.addressLine}</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400">Phone: {app.phone}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
                <div>
                  <span className="block font-semibold text-gray-400">FSSAI License</span>
                  <span className="font-bold text-gray-900">{app.licenseFssai}</span>
                </div>
                <div>
                  <span className="block font-semibold text-gray-400">GSTIN Number</span>
                  <span className="font-bold text-gray-900">{app.gstin || 'N/A'}</span>
                </div>
                <div>
                  <span className="block font-semibold text-gray-400">Owner Email</span>
                  <span className="font-bold text-gray-900">{app.email || 'N/A'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-3">
                <button
                  onClick={() => handleAction(app.id, 'APPROVED')}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve &amp; Activate Owner
                </button>
                <button
                  onClick={() => handleAction(app.id, 'REJECTED')}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100"
                >
                  <XCircle className="h-4 w-4" /> Reject Application
                </button>
                <button
                  onClick={() => alert('Request sent for updated FSSAI & bank document copies.')}
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
