'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, FileText, Eye, X, ExternalLink } from 'lucide-react';
import { adminFetch } from '../../../utils/admin-fetch';
import { getImageUrl } from '@foodhub/config';

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
  documents?: Array<{
    documentType: string;
    documentUrl: string;
    isVerified: boolean;
  }>;
}

export default function AdminDriverApprovalPage() {
  const [applications, setApplications] = useState<PendingDriverApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; type: string } | null>(null);

  const fetchApplications = async () => {
    try {
      const res = await adminFetch('/drivers/applications');
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
      const res = await adminFetch(`/drivers/${id}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ isApproved }),
      });
      if (res.ok) {
        fetchApplications();
      }
    } catch { /* offline */ }
  };

  const getDocUrl = (app: PendingDriverApplication, type: string): string | null => {
    const doc = app.documents?.find((d) => d.documentType === type);
    return doc?.documentUrl ? getImageUrl(doc.documentUrl) : null;
  };

  const isPdf = (url: string) => url.toLowerCase().includes('.pdf');

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

              {/* Courier Verification Documents */}
              <div className="rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100 space-y-2">
                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                  Courier Verification Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="block font-semibold text-indigo-700 mb-1">Driving License Photo</span>
                    {getDocUrl(app, 'DL') ? (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc({
                          url: getDocUrl(app, 'DL')!,
                          title: `${app.user?.profile?.firstName || 'Driver'}'s Driving License`,
                          type: 'DL'
                        })}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview DL Document
                      </button>
                    ) : (
                      <span className="text-indigo-400 font-bold">Document Pending</span>
                    )}
                  </div>
                  <div>
                    <span className="block font-semibold text-indigo-700 mb-1">Vehicle RC Document</span>
                    {getDocUrl(app, 'RC') ? (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc({
                          url: getDocUrl(app, 'RC')!,
                          title: `${app.user?.profile?.firstName || 'Driver'}'s Vehicle RC Document`,
                          type: 'RC'
                        })}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview RC Document
                      </button>
                    ) : (
                      <span className="text-indigo-400 font-bold">Document Pending</span>
                    )}
                  </div>
                  <div>
                    <span className="block font-semibold text-indigo-700 mb-1">Aadhaar / ID Proof</span>
                    {getDocUrl(app, 'AADHAAR') ? (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc({
                          url: getDocUrl(app, 'AADHAAR')!,
                          title: `${app.user?.profile?.firstName || 'Driver'}'s Identity Proof`,
                          type: 'AADHAAR'
                        })}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview ID Document
                      </button>
                    ) : (
                      <span className="text-indigo-400 font-bold">Document Pending</span>
                    )}
                  </div>
                </div>
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
              </div>
            </div>
          ))
        )}
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-black text-gray-900">{previewDoc.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline px-2 py-1 rounded-lg"
                >
                  <ExternalLink className="h-4 w-4" /> Open in New Tab
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-full p-1 hover:bg-gray-100 text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl bg-gray-50 flex items-center justify-center p-4 min-h-[300px]">
              {isPdf(previewDoc.url) ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-[500px] rounded-xl border border-gray-200"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[500px] w-auto rounded-xl object-contain shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
