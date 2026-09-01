'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Download, MapPin, UserCircle, FileText, Bike, Clock, ShieldCheck } from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

interface ReviewDriverModalProps {
  driverId: string;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export default function ReviewDriverModal({ driverId, onClose, onApprove, onReject }: ReviewDriverModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await adminFetch(`/drivers/${driverId}`);
        if (res.ok) {
          setData(await res.json());
        } else {
          throw new Error('Failed to fetch details');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch full application details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [driverId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl p-8 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-xl bg-white rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black text-rose-600">Error Loading Application</h2>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  const user = data.user;
  const profile = user?.profile;
  const vehicle = data.vehicles?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6 overflow-hidden">
      <div className="w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-5xl bg-gray-50 sm:rounded-2xl flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="flex-none bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 sm:rounded-t-2xl">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-teal-600" />
              Delivery Partner Verification
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Application ID: <span className="font-mono text-xs">{data.id}</span></p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. PERSONAL INFORMATION */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-black text-gray-400 tracking-wider uppercase flex items-center gap-2 mb-4">
                <UserCircle className="w-4 h-4" /> Personal Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2 border-b pb-2">
                  <span className="text-gray-500 font-medium">Full Name</span>
                  <span className="col-span-2 font-bold text-gray-900">{profile?.firstName} {profile?.lastName}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b pb-2">
                  <span className="text-gray-500 font-medium">Phone</span>
                  <span className="col-span-2 font-mono text-gray-900 flex items-center gap-2">
                    {user?.phone} 
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">Verified</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b pb-2">
                  <span className="text-gray-500 font-medium">Email</span>
                  <span className="col-span-2 text-gray-900">{user?.email || '—'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500 font-medium">Applied On</span>
                  <span className="col-span-2 text-gray-900">{new Date(data.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 2. VEHICLE DETAILS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-black text-gray-400 tracking-wider uppercase flex items-center gap-2 mb-4">
                <Bike className="w-4 h-4" /> Vehicle Information
              </h3>
              {vehicle ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="text-gray-500 font-medium">Type</span>
                    <span className="col-span-2 font-bold text-gray-900">{vehicle.vehicleType}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="text-gray-500 font-medium">Reg. Number</span>
                    <span className="col-span-2 font-mono font-bold text-gray-900">{vehicle.vehicleNumber}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 italic">No vehicle details provided.</div>
              )}
            </div>

            {/* 3. DOCUMENTS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-black text-gray-400 tracking-wider uppercase flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4" /> Identity & Compliance Documents
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2 border-b pb-2">
                  <span className="text-gray-500 font-medium">Driving License</span>
                  <span className="col-span-2 font-mono font-bold text-gray-900">{data.licenseNumber}</span>
                </div>
                
                {data.documents?.map((doc: any) => (
                  <div key={doc.id} className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="text-gray-500 font-medium">{doc.documentType} Doc</span>
                    <span className="col-span-2">
                      <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold flex items-center gap-1 hover:underline">
                        <Download className="w-3 h-3" /> View {doc.documentType}
                      </a>
                    </span>
                  </div>
                ))}
                
                {(!data.documents || data.documents.length === 0) && (
                  <div className="text-gray-500 italic">No document uploads found.</div>
                )}
              </div>
            </div>

            {/* 4. APPLICATION HISTORY */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-black text-gray-400 tracking-wider uppercase flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" /> Application Status
              </h3>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  data.isApproved ? 'bg-emerald-100 text-emerald-700' :
                  data.status === 'SUSPENDED' ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {data.isApproved ? 'Approved' : data.status === 'SUSPENDED' ? 'Suspended/Rejected' : 'Pending Review'}
                </span>
                <span className="text-sm text-gray-500 font-medium">
                  Last updated: {new Date(data.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-none bg-white border-t p-4 sm:px-6 flex flex-col sm:flex-row gap-3 items-center justify-between rounded-b-2xl">
          {rejectMode ? (
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                placeholder="Enter rejection/suspension reason (required)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setRejectMode(false);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  disabled={!rejectReason.trim()}
                  onClick={() => {
                    onReject(data.id, rejectReason);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-black text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Close View
              </button>
              <div className="w-full sm:w-auto flex gap-3">
                {!data.isApproved && (
                  <button
                    onClick={() => onApprove(data.id)}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-white bg-teal-600 hover:bg-teal-700 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                )}
                {data.status !== 'SUSPENDED' && (
                  <button
                    onClick={() => setRejectMode(true)}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 transition flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" /> Reject/Suspend
                  </button>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
