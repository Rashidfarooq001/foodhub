'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Download, MapPin, Store, FileText, Landmark, Clock, FileImage, ShieldCheck } from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

interface ReviewRestaurantModalProps {
  restaurantId: string;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export default function ReviewRestaurantModal({ restaurantId, onClose, onApprove, onReject }: ReviewRestaurantModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await adminFetch(`/restaurants/${restaurantId}`);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch full application details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [restaurantId]);

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

  const owner = data.staff?.find((s: any) => s.designation?.toUpperCase() === 'OWNER')?.user || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6 overflow-hidden">
      <div className="w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-5xl bg-gray-50 sm:rounded-2xl flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="flex-none bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 sm:rounded-t-2xl">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-orange-600" />
              Restaurant Verification
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
            
            {/* 1. OWNER INFORMATION */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-black text-gray-400 tracking-wider uppercase flex items-center gap-2 mb-4">
                <Store className="w-4 h-4" /> Owner Information
              </h3>
              {owner ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="text-gray-500 font-medium">Full Name</span>
                    <span className="col-span-2 font-bold text-gray-900">{owner.profile?.firstName} {owner.profile?.lastName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="text-gray-500 font-medium">Phone</span>
                    <span className="col-span-2 font-mono text-gray-900 flex items-center gap-2">
                      {owner.phone} 
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">Verified</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="text-gray-500 font-medium">Email</span>
                    <span className="col-span-2 text-gray-900">{owner.email || '—'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 font-medium">Created On</span>
                    <span className="col-span-2 text-gray-900">{new Date(owner.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No owner information found.</div>
              )}
            </div>

            {/* 2. RESTAURANT INFORMATION */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-black text-gray-400 tracking-wider uppercase flex items-center gap-2 mb-4">
                <Store className="w-4 h-4" /> Restaurant Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2 border-b pb-2">
                  <span className="text-gray-500 font-medium">Name</span>
                  <span className="col-span-2 font-black text-gray-900 text-base">{data.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b pb-2">
                  <span className="text-gray-500 font-medium">Address</span>
                  <span className="col-span-2 text-gray-900 leading-relaxed">{data.addressLine}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b pb-2">
                  <span className="text-gray-500 font-medium">Delivery Mode</span>
                  <span className="col-span-2 font-bold text-orange-600">{data.deliveryMode}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500 font-medium">Delivery Radius</span>
                  <span className="col-span-2 text-gray-900 font-mono">{data.deliveryRadius} km</span>
                </div>
              </div>
            </div>

            {/* 3. GPS / LOCATION */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-black text-gray-400 tracking-wider uppercase flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4" /> Location Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2 border-b pb-2">
                  <span className="text-gray-500 font-medium">Coordinates</span>
                  <span className="col-span-2 font-mono text-gray-900 text-xs">
                    {data.latitude}, {data.longitude}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b pb-2">
                  <span className="text-gray-500 font-medium">Google Maps</span>
                  <span className="col-span-2">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`} 
                      target="_blank" rel="noreferrer"
                      className="text-blue-600 font-bold hover:underline"
                    >
                      View on Maps ↗
                    </a>
                  </span>
                </div>
              </div>
            </div>

            {/* 4. FSSAI / LEGAL & BANK */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-black text-gray-400 tracking-wider uppercase flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4" /> Legal & Banking
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2 border-b pb-2">
                  <span className="text-gray-500 font-medium">FSSAI License</span>
                  <span className="col-span-2 font-mono font-bold text-gray-900">{data.licenseFssai}</span>
                </div>
                {data.fssaiUrl && (
                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="text-gray-500 font-medium">FSSAI Doc</span>
                    <span className="col-span-2">
                      <a href={data.fssaiUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold flex items-center gap-1 hover:underline">
                        <Download className="w-3 h-3" /> View Document
                      </a>
                    </span>
                  </div>
                )}
                {data.gstin && (
                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="text-gray-500 font-medium">GSTIN</span>
                    <span className="col-span-2 font-mono text-gray-900">{data.gstin}</span>
                  </div>
                )}
                
                <h4 className="pt-2 text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                  <Landmark className="w-3 h-3" /> Settlement Account
                </h4>
                {data.bankAccount ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 border-b pb-2">
                      <span className="text-gray-500 font-medium">Bank Name</span>
                      <span className="col-span-2 text-gray-900">{data.bankAccount.bankName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-b pb-2">
                      <span className="text-gray-500 font-medium">Acc Holder</span>
                      <span className="col-span-2 text-gray-900">{data.bankAccount.accountHolder}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-b pb-2">
                      <span className="text-gray-500 font-medium">Account No.</span>
                      <span className="col-span-2 font-mono text-gray-900">
                        XXXX{data.bankAccount.accountNumber?.slice(-4) || 'XXXX'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-b pb-2">
                      <span className="text-gray-500 font-medium">IFSC</span>
                      <span className="col-span-2 font-mono text-gray-900">{data.bankAccount.ifscCode}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 italic">No bank details provided.</div>
                )}
              </div>
            </div>

          </div>

          {/* 5. APPLICATION HISTORY */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-xs font-black text-gray-400 tracking-wider uppercase flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4" /> Application Status
            </h3>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                data.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                data.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {data.status}
              </span>
              <span className="text-sm text-gray-500 font-medium">
                Last updated: {new Date(data.updatedAt).toLocaleString()}
              </span>
            </div>
            {data.rejectionReason && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-sm">
                <span className="font-bold text-rose-800">Previous Rejection Reason:</span>
                <p className="text-rose-700 mt-1">{data.rejectionReason}</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex-none bg-white border-t p-4 sm:px-6 flex flex-col sm:flex-row gap-3 items-center justify-between rounded-b-2xl">
          {rejectMode ? (
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                placeholder="Enter exact rejection reason (required)..."
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
                {data.status !== 'APPROVED' && (
                  <button
                    onClick={() => onApprove(data.id)}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                )}
                {data.status !== 'REJECTED' && (
                  <button
                    onClick={() => setRejectMode(true)}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 transition flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" /> Reject
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
