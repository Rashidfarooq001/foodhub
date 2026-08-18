'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  X,
  ExternalLink,
  Bike,
  RefreshCw,
  Phone,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { adminFetch } from '../../../utils/admin-fetch';
import { getImageUrl } from '@foodhub/config';

interface PendingDriverApplication {
  id: string;
  licenseNumber: string;
  isApproved: boolean;
  status?: string;
  user?: {
    phone?: string;
    email?: string;
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

export default function AdminDriverApprovalPage() {
  const [applications, setApplications] = useState<PendingDriverApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await adminFetch('/drivers/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : []);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.message || 'Failed to load driver applications.');
      }
    } catch {
      setErrorMsg('Connection error loading applications queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAction = async (id: string, isApproved: boolean) => {
    setProcessingId(id);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Optimistically remove from view for instant feedback
    const previousList = [...applications];
    setApplications((prev) => prev.filter((app) => app.id !== id));

    try {
      const res = await adminFetch(`/drivers/${id}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isApproved,
          status: isApproved ? 'APPROVED' : 'REJECTED',
          reason: isApproved ? 'Approved by Admin' : 'Rejected by Admin',
        }),
      });

      if (res.ok) {
        setSuccessMsg(
          isApproved
            ? 'Courier partner approved and activated successfully!'
            : 'Courier partner application rejected and removed from pending queue.',
        );
        // Refresh silently from backend
        const refreshRes = await adminFetch('/drivers/applications');
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          setApplications(Array.isArray(freshData) ? freshData : []);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.message || `Failed to ${isApproved ? 'approve' : 'reject'} driver.`);
        setApplications(previousList);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error performing action.');
      setApplications(previousList);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Courier Verification Queue
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Verify driving licenses, vehicle RC records &amp; fleet onboarding
          </p>
        </div>

        <button
          onClick={fetchApplications}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-700 shadow-sm">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Applications List */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          Pending Driver Applications ({applications.length})
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400">Loading driver applications...</div>
        ) : applications.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6">
            <Bike className="h-8 w-8 mx-auto text-gray-300 mb-1" />
            No pending driver partner applications requiring review right now.
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const name = `${app.user?.profile?.firstName || ''} ${app.user?.profile?.lastName || ''}`.trim() || 'Courier Applicant';
              const isItemProcessing = processingId === app.id;

              return (
                <div
                  key={app.id}
                  className={`p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3 transition ${
                    isItemProcessing ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div>
                      <h3 className="font-black text-sm text-gray-900">{name}</h3>
                      <p className="text-[11px] text-gray-500 font-medium">{app.user?.phone || 'No phone'}</p>
                    </div>

                    <span className="rounded-xl bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
                      Pending
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Driving License</span>
                    <span className="font-mono font-bold text-gray-900">{app.licenseNumber || 'DL-2024-XXXX'}</span>
                  </div>

                  {/* Document Links */}
                  {app.documents && app.documents.length > 0 && (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5 text-xs">
                      <span className="text-[10px] font-black uppercase text-gray-400 block">SUBMITTED KYC DOCUMENTS</span>
                      <div className="flex flex-wrap gap-2">
                        {app.documents.map((doc, dIdx) => (
                          <button
                            key={dIdx}
                            type="button"
                            onClick={() => setPreviewDoc({ url: getImageUrl(doc.documentUrl), title: doc.documentType })}
                            className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-bold text-teal-800 hover:bg-teal-50 min-h-[32px]"
                          >
                            <FileText className="h-3 w-3 text-teal-600" />
                            <span>{doc.documentType.replace('_', ' ')}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-100 flex gap-2">
                    <button
                      onClick={() => handleAction(app.id, true)}
                      disabled={isItemProcessing}
                      className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 py-2.5 text-xs font-black text-white shadow-md shadow-teal-500/20 min-h-[44px] transition"
                    >
                      {isItemProcessing ? 'Processing...' : 'Approve Driver'}
                    </button>
                    <button
                      onClick={() => handleAction(app.id, false)}
                      disabled={isItemProcessing}
                      className="flex-1 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 py-2.5 text-xs font-bold min-h-[44px] transition"
                    >
                      {isItemProcessing ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Preview Bottom Sheet */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-black text-gray-900">{previewDoc.title}</h2>
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-2 rounded-2xl bg-gray-50 border border-gray-200">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="w-full h-auto max-h-96 object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80';
                }}
              />
            </div>

            <div className="pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-full rounded-2xl bg-gray-900 hover:bg-black py-3 text-xs font-black text-white min-h-[44px]"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
