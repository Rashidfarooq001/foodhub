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
  Mail,
  MapPin,
  Calendar,
  Clock,
  ShieldAlert,
  X,
  ExternalLink,
  Download,
} from 'lucide-react';
import { adminFetch } from '../../../utils/admin-fetch';

interface RestaurantApplication {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  licenseFssai: string;
  fssaiUrl?: string;
  panNumber?: string;
  panUrl?: string;
  menuUrl?: string;
  bannerUrl?: string;
  logoUrl?: string;
  addressLine: string;
  rejectionReason?: string;
  createdAt: string;
  staff?: Array<{
    designation?: string;
    user?: {
      phone?: string;
      email?: string;
      profile?: {
        firstName?: string;
        lastName?: string;
      };
    };
  }>;
  documents?: Array<{
    documentType: string;
    documentUrl: string;
    isVerified: boolean;
  }>;
}

export default function AdminRestaurantApprovalPage() {
  const [applications, setApplications] = useState<RestaurantApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<RestaurantApplication | null>(null);

  // Rejection Modal State
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch(`/restaurants/applications?status=${activeTab}`);
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
  }, [activeTab]);

  const handleApprove = async (id: string) => {
    setIsSubmittingAction(true);
    try {
      const res = await adminFetch(`/restaurants/${id}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (res.ok) {
        if (selectedApp?.id === id) setSelectedApp(null);
        fetchApplications();
      }
    } catch {
      fetchApplications();
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectingAppId(id);
    setRejectionReasonInput('');
    setRejectionError(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReasonInput.trim()) {
      setRejectionError('A valid rejection reason is mandatory when rejecting an application.');
      return;
    }
    if (!rejectingAppId) return;

    setIsSubmittingAction(true);
    setRejectionError(null);

    try {
      const res = await adminFetch(`/restaurants/${rejectingAppId}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason: rejectionReasonInput.trim(),
        }),
      });

      if (res.ok) {
        setRejectingAppId(null);
        if (selectedApp?.id === rejectingAppId) setSelectedApp(null);
        fetchApplications();
      } else {
        const data = await res.json().catch(() => ({}));
        setRejectionError(data.message || 'Failed to reject application.');
      }
    } catch (err: any) {
      setRejectionError(err.message || 'Connection error.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getOwnerName = (app: RestaurantApplication) => {
    const ownerStaff = app.staff?.find((s) => s.designation === 'Owner');
    if (ownerStaff?.user?.profile?.firstName) {
      return `${ownerStaff.user.profile.firstName} ${ownerStaff.user.profile.lastName || ''}`.trim();
    }
    return app.name + ' Owner';
  };

  const getDocUrl = (app: RestaurantApplication, type: string): string | null => {
    const doc = app.documents?.find((d) => d.documentType === type);
    if (doc) return doc.documentUrl;
    if (type === 'FSSAI') return app.fssaiUrl || null;
    if (type === 'PAN') return app.panUrl || null;
    if (type === 'MENU') return app.menuUrl || null;
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Restaurant Onboarding Applications</h1>
          <p className="text-xs text-gray-500 mt-1">
            Review self-registered merchant partner applications, inspect legal documents &amp; verify approval status
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
        {[
          { id: 'PENDING', label: 'Pending Review' },
          { id: 'APPROVED', label: 'Approved Partners' },
          { id: 'REJECTED', label: 'Rejected Applications' },
          { id: 'ALL', label: 'All Applications' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition min-h-[40px] ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-xs font-bold text-gray-400">
          Loading onboarding applications...
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-xs font-bold text-gray-400">
          No restaurant applications found under &quot;{activeTab}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app) => (
            <div key={app.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4 hover:border-purple-200 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-gray-900">{app.name}</h3>
                    <span
                      className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{app.addressLine}</p>
                </div>
                <span className="text-xs font-bold text-gray-400">
                  Submitted: {new Date(app.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                <div>
                  <span className="block font-semibold text-gray-400">Owner Name</span>
                  <span className="font-bold text-gray-900">{getOwnerName(app)}</span>
                </div>
                <div>
                  <span className="block font-semibold text-gray-400">Phone</span>
                  <span className="font-bold text-gray-900">{app.phone}</span>
                </div>
                <div>
                  <span className="block font-semibold text-gray-400">FSSAI License</span>
                  <span className="font-bold text-gray-900">{app.licenseFssai}</span>
                </div>
                <div>
                  <span className="block font-semibold text-gray-400">Email</span>
                  <span className="font-bold text-gray-900 truncate block">{app.email || 'N/A'}</span>
                </div>
              </div>

              {app.rejectionReason && (
                <div className="rounded-2xl bg-rose-50 p-3 border border-rose-200 text-xs font-bold text-rose-800">
                  <span className="text-[10px] uppercase block font-black text-rose-600">Rejection Reason:</span>
                  <span>{app.rejectionReason}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                <button
                  onClick={() => setSelectedApp(app)}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                >
                  <Eye className="h-4 w-4 text-purple-600" /> View Complete Application
                </button>

                <div className="flex items-center gap-2">
                  {app.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleApprove(app.id)}
                      disabled={isSubmittingAction}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </button>
                  )}
                  {app.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleOpenRejectModal(app.id)}
                      disabled={isSubmittingAction}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COMPLETE APPLICATION VIEW MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">
                  Application Details #{selectedApp.id.slice(0, 8)}
                </span>
                <h2 className="text-2xl font-black text-gray-900">{selectedApp.name}</h2>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="rounded-2xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* OWNER INFORMATION */}
            <div className="space-y-3 rounded-2xl bg-gray-50 p-4 border border-gray-100">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-4 w-4 text-purple-600" /> Owner Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="block font-semibold text-gray-400">Owner Name</span>
                  <span className="font-bold text-gray-900">{getOwnerName(selectedApp)}</span>
                </div>
                <div>
                  <span className="block font-semibold text-gray-400">Phone</span>
                  <span className="font-bold text-gray-900">{selectedApp.phone}</span>
                </div>
                <div>
                  <span className="block font-semibold text-gray-400">Email</span>
                  <span className="font-bold text-gray-900">{selectedApp.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* RESTAURANT INFORMATION */}
            <div className="space-y-3 rounded-2xl bg-gray-50 p-4 border border-gray-100">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="h-4 w-4 text-purple-600" /> Restaurant Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <span className="block font-semibold text-gray-400">Address</span>
                  <span className="font-bold text-gray-900">{selectedApp.addressLine}</span>
                </div>
                <div>
                  <span className="block font-semibold text-gray-400">FSSAI License No.</span>
                  <span className="font-bold text-gray-900">{selectedApp.licenseFssai}</span>
                </div>
                <div>
                  <span className="block font-semibold text-gray-400">PAN Card No.</span>
                  <span className="font-bold text-gray-900">{selectedApp.panNumber || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* MENU & VISUALS */}
            <div className="space-y-3 rounded-2xl bg-gray-50 p-4 border border-gray-100">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-purple-600" /> Submitted Menu &amp; Visuals
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="block font-semibold text-gray-400 mb-1">Restaurant Menu</span>
                  {getDocUrl(selectedApp, 'MENU') ? (
                    <a
                      href={getDocUrl(selectedApp, 'MENU')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-purple-600 font-bold hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View Menu File
                    </a>
                  ) : (
                    <span className="text-gray-400 font-bold">No file uploaded</span>
                  )}
                </div>

                <div>
                  <span className="block font-semibold text-gray-400 mb-1">Store Banner Photo</span>
                  {selectedApp.bannerUrl ? (
                    <a
                      href={selectedApp.bannerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-purple-600 font-bold hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View Cover Image
                    </a>
                  ) : (
                    <span className="text-gray-400 font-bold">No photo uploaded</span>
                  )}
                </div>

                <div>
                  <span className="block font-semibold text-gray-400 mb-1">Store Logo</span>
                  {selectedApp.logoUrl ? (
                    <a
                      href={selectedApp.logoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-purple-600 font-bold hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View Logo Image
                    </a>
                  ) : (
                    <span className="text-gray-400 font-bold">No logo uploaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* LEGAL DOCUMENTS (PROTECTED ADMIN ACCESS) */}
            <div className="space-y-3 rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100">
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-indigo-600" /> Protected Legal Documents
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block font-semibold text-indigo-700 mb-1">FSSAI License Document</span>
                  {getDocUrl(selectedApp, 'FSSAI') ? (
                    <a
                      href={getDocUrl(selectedApp, 'FSSAI')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open FSSAI Document
                    </a>
                  ) : (
                    <span className="text-indigo-400 font-bold">Document Pending</span>
                  )}
                </div>

                <div>
                  <span className="block font-semibold text-indigo-700 mb-1">PAN Card Document</span>
                  {getDocUrl(selectedApp, 'PAN') ? (
                    <a
                      href={getDocUrl(selectedApp, 'PAN')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open PAN Card Document
                    </a>
                  ) : (
                    <span className="text-indigo-400 font-bold">Document Pending</span>
                  )}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              {selectedApp.status !== 'APPROVED' && (
                <button
                  onClick={() => handleApprove(selectedApp.id)}
                  disabled={isSubmittingAction}
                  className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-emerald-700 transition"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve Application
                </button>
              )}
              {selectedApp.status !== 'REJECTED' && (
                <button
                  onClick={() => handleOpenRejectModal(selectedApp.id)}
                  disabled={isSubmittingAction}
                  className="flex items-center gap-1.5 rounded-2xl bg-rose-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-rose-700 transition"
                >
                  <XCircle className="h-4 w-4" /> Reject Application
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPULSORY REJECTION REASON MODAL */}
      {rejectingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-rose-600 flex items-center gap-1.5">
                <XCircle className="h-5 w-5" /> Reject Restaurant Application
              </h3>
              <button
                onClick={() => setRejectingAppId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {rejectionError && (
              <div className="rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-200">
                ⚠️ {rejectionError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Rejection Reason <span className="text-rose-600 font-bold">* (Compulsory)</span>
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. FSSAI License document could not be verified or is expired."
                className="w-full rounded-2xl border border-gray-200 p-3 text-xs font-bold text-gray-900 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingAppId(null)}
                className="rounded-2xl border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmReject}
                disabled={isSubmittingAction}
                className="rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-rose-700 disabled:opacity-50"
              >
                {isSubmittingAction ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
