'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  Store,
  User,
  Phone,
  MapPin,
  RefreshCw,
  X,
  ExternalLink,
} from 'lucide-react';
import { adminFetch } from '../../../utils/admin-fetch';
import { getImageUrl } from '@foodhub/config';

interface RestaurantApplication {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status: string;
  licenseFssai: string;
  fssaiUrl?: string;
  panNumber?: string;
  panUrl?: string;
  addressLine: string;
  commissionRate?: number | null;
  rejectionReason?: string;
  createdAt: string;
  owner?: {
    phone?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  documents?: Array<{
    documentType: string;
    documentUrl: string;
    isVerified: boolean;
  }>;
}

export default function AdminRestaurantApprovalPage() {
  const [applications, setApplications] = useState<RestaurantApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<RestaurantApplication | null>(null);

  // Rejection Modal
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch(`/restaurants/applications?status=PENDING`);
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : []);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (id: string) => {
    setIsSubmittingAction(true);
    try {
      const res = await adminFetch(`/restaurants/${id}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (res.ok) {
        await fetchApplications();
      }
    } catch {
      /* ignore */
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingAppId || !rejectionReasonInput.trim()) {
      setRejectionError('A valid rejection reason is mandatory.');
      return;
    }

    setIsSubmittingAction(true);
    setRejectionError(null);

    try {
      const res = await adminFetch(`/restaurants/${rejectingAppId}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason: rejectionReasonInput.trim(),
        }),
      });

      if (res.ok) {
        setRejectingAppId(null);
        setRejectionReasonInput('');
        await fetchApplications();
      } else {
        const err = await res.json().catch(() => ({}));
        setRejectionError(err.message || 'Failed to reject application.');
      }
    } catch (err: any) {
      setRejectionError(err.message || 'Network error.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Restaurant Verification Queue
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Audit merchant FSSAI food safety licenses, PAN cards &amp; store onboarding
          </p>
        </div>

        <button
          onClick={fetchApplications}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Application Cards (Mobile-first dual layout) */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          Applications ({applications.length})
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No restaurant applications found.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block lg:hidden space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div>
                      <h3 className="font-black text-sm text-gray-900">{app.name}</h3>
                      <p className="text-[11px] text-gray-500 font-medium">{app.phone || 'No phone'}</p>
                    </div>

                    <span className={`rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      app.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1 text-gray-700">
                      <FileText className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                      <span>FSSAI: <strong className="font-mono">{app.licenseFssai || 'Pending Document'}</strong></span>
                    </div>

                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                      <span className="truncate">{app.addressLine || 'Address provided during onboarding'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 min-h-[40px] flex items-center justify-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Review Docs</span>
                    </button>

                    {app.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleApprove(app.id)}
                        disabled={isSubmittingAction}
                        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2 text-xs font-black text-white shadow-sm min-h-[40px]"
                      >
                        Approve
                      </button>
                    )}

                    {app.status !== 'REJECTED' && (
                      <button
                        onClick={() => {
                          setRejectingAppId(app.id);
                          setRejectionReasonInput('');
                          setRejectionError(null);
                        }}
                        disabled={isSubmittingAction}
                        className="rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-2 text-xs font-bold min-h-[40px]"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Restaurant</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">FSSAI License</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Submitted</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-bold text-gray-900">{app.name}</td>
                      <td className="py-3 text-gray-600">{app.phone || '—'}</td>
                      <td className="py-3 font-mono text-gray-800">{app.licenseFssai || '—'}</td>
                      <td className="py-3">
                        <span className={`rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          app.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400">{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50"
                        >
                          Review
                        </button>
                        {app.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleApprove(app.id)}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-black text-white hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                        )}
                        {app.status !== 'REJECTED' && (
                          <button
                            onClick={() => {
                              setRejectingAppId(app.id);
                              setRejectionReasonInput('');
                              setRejectionError(null);
                            }}
                            className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Document Review Bottom Sheet */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 sticky top-0 bg-white z-10">
              <h2 className="text-base font-black text-gray-900">Application KYC: {selectedApp.name}</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">FSSAI License</span>
                <span className="font-mono text-sm font-black text-gray-900 block">{selectedApp.licenseFssai || 'Not provided'}</span>
                {selectedApp.fssaiUrl && (
                  <a
                    href={getImageUrl(selectedApp.fssaiUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-purple-600 font-bold hover:underline pt-1"
                  >
                    <span>View FSSAI Certificate Document</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">PAN &amp; Tax Registration</span>
                <span className="font-mono text-sm font-black text-gray-900 block">{selectedApp.panNumber || 'Not provided'}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedApp(null)}
                className="w-full rounded-2xl bg-gray-900 hover:bg-black py-3 text-xs font-black text-white min-h-[44px]"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Bottom Sheet */}
      {rejectingAppId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-black text-gray-900">Mandatory Rejection Reason</h2>
              <button
                onClick={() => setRejectingAppId(null)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {rejectionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                {rejectionError}
              </div>
            )}

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reason for Rejecting Application *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify missing FSSAI certification, expired documents, or municipal compliance failure..."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs font-medium text-gray-900 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingAppId(null)}
                  className="flex-1 rounded-2xl border border-gray-200 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction || !rejectionReasonInput.trim()}
                  className="flex-1 rounded-2xl bg-rose-600 hover:bg-rose-700 py-3 text-xs font-black text-white shadow-md shadow-rose-500/20 transition min-h-[44px]"
                >
                  {isSubmittingAction ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
