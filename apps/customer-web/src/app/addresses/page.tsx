'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, X, Navigation, Home, Briefcase, Tag } from 'lucide-react';
import { useAddressStore } from '../../stores/use-address-store';
import { useAuthStore } from '../../stores/use-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function AddressesPage() {
  const { addresses, selectedAddressId, setSelectedAddress, setAddresses, addAddress, removeAddress } = useAddressStore();
  const { accessToken } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [label, setLabel] = useState('Home');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [matchedAddress, setMatchedAddress] = useState<any>(null);

  const fetchAddresses = async () => {
    try {
      const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await fetch(`${API_BASE}/addresses`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAddresses(
            data.map((a: any) => ({
              id: a.id,
              label: a.addressLabel || 'Home',
              addressLine1: a.addressLine1,
              addressLine2: a.addressLine2,
              city: a.city,
              state: a.state,
              postalCode: a.postalCode,
              latitude: a.latitude,
              longitude: a.longitude,
              isDefault: a.isDefault,
            })),
          );
        }
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [accessToken]);

  const handleVerifyAddress = async () => {
    if (!addressLine1.trim()) return;
    setIsVerifying(true);
    setVerificationError('');
    setMatchedAddress(null);
    try {
      const res = await fetch(`${API_BASE}/location/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: addressLine1.trim() }),
      });
      const data = await res.json();
      if (data.success && data.latitude && data.longitude) {
        setMatchedAddress({
          latitude: data.latitude,
          longitude: data.longitude,
          formattedAddress: data.formattedAddress || addressLine1.trim(),
        });
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setCity(data.city || '');
        setState(data.state || '');
        setPostalCode(data.postalCode || '');
      } else {
        setVerificationError("Couldn't find this address. Please enter a more specific address.");
      }
    } catch {
      setVerificationError("Unable to verify this address right now. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!matchedAddress) return;
    setIsSubmitting(true);

    const payload = {
      addressLabel: label,
      addressLine1: addressLine1.trim(),
      addressLine2: matchedAddress.formattedAddress,
      city,
      state,
      postalCode,
      latitude,
      longitude,
      isDefault: addresses.length === 0,
    };

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };
      const res = await fetch(`${API_BASE}/addresses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        addAddress({
          id: created.id,
          label: created.addressLabel,
          addressLine1: created.addressLine1,
          addressLine2: created.addressLine2,
          city: created.city,
          state: created.state,
          postalCode: created.postalCode,
          latitude: created.latitude,
          longitude: created.longitude,
          isDefault: created.isDefault,
        });
        setIsAddModalOpen(false);
        setAddressLine1('');
        setAddressLine2('');
        setMatchedAddress(null);
      }
    } catch {
      /* fallback store update */
      addAddress({
        label,
        addressLine1: payload.addressLine1,
        addressLine2: payload.addressLine2,
        city: payload.city,
        state: payload.state,
        postalCode: payload.postalCode,
        latitude: payload.latitude,
        longitude: payload.longitude,
        isDefault: false,
      });
      setIsAddModalOpen(false);
      setAddressLine1('');
      setAddressLine2('');
      setMatchedAddress(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      await fetch(`${API_BASE}/addresses/${id}`, { method: 'DELETE', headers });
    } catch {
      /* offline */
    }
    removeAddress(id);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Saved Delivery Addresses</h1>
          <p className="text-xs text-gray-500 mt-1">Manage your home, office &amp; custom food delivery locations.</p>
        </div>
        <button
          onClick={() => {
            setIsAddModalOpen(true);
            setMatchedAddress(null);
            setAddressLine1('');
            setVerificationError('');
          }}
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700 transition"
        >
          <Plus className="h-4 w-4" /> Add New Address
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-xs font-bold text-gray-400 space-y-3">
          <MapPin className="h-10 w-10 mx-auto text-gray-300" />
          <p>No saved addresses yet. Click &quot;Add New Address&quot; above to add your location.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative rounded-2xl border p-4 space-y-4 shadow-sm transition ${
                selectedAddressId === addr.id
                  ? 'border-orange-500 bg-orange-50/30 ring-2 ring-orange-500/20'
                  : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-gray-900">
                  {addr.label === 'Home' ? (
                    <Home className="h-4 w-4 text-orange-600" />
                  ) : addr.label === 'Work' ? (
                    <Briefcase className="h-4 w-4 text-orange-600" />
                  ) : (
                    <Tag className="h-4 w-4 text-orange-600" />
                  )}
                  <span>{addr.label}</span>
                </div>
                {selectedAddressId === addr.id && (
                  <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-white px-2.5 py-0.5 rounded-full shadow-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                {addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}{addr.city}, {addr.state} - {addr.postalCode}
              </p>

              <div className="flex justify-between items-center border-t border-gray-100 pt-3 text-xs font-bold">
                <button
                  onClick={() => setSelectedAddress(addr.id)}
                  className="text-orange-600 hover:underline"
                >
                  Use for Orders
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-gray-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MAP ADDRESS PICKER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-4 sm:p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Navigation className="h-5 w-5 text-orange-600" /> New Delivery Location
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Address Type</label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLabel(l)}
                      className={`flex-1 rounded-2xl py-2.5 text-xs font-bold border transition ${
                        label === l ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-xs' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Complete Address *</label>
                <textarea
                  required
                  rows={4}
                  value={addressLine1}
                  onChange={(e) => {
                    setAddressLine1(e.target.value);
                    setMatchedAddress(null);
                  }}
                  placeholder="House 24, Kenusa, Dangarpora, Baramulla, Jammu & Kashmir 193201"
                  disabled={isVerifying}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-900 focus:border-orange-500 focus:outline-none resize-none disabled:opacity-50"
                />
              </div>
              
              {verificationError && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-100">
                  <p>{verificationError}</p>
                </div>
              )}

              {!matchedAddress ? (
                <button
                  type="button"
                  onClick={handleVerifyAddress}
                  disabled={!addressLine1.trim() || isVerifying}
                  className="w-full rounded-2xl bg-gray-900 py-3.5 text-sm font-black text-white hover:bg-gray-800 transition disabled:opacity-50 shadow-sm"
                >
                  {isVerifying ? 'Checking address...' : 'Verify Address'}
                </button>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-black">Address matched</h4>
                  </div>
                  <p className="text-xs font-bold text-emerald-900/70">? Mappls verified location</p>
                  <p className="text-sm font-bold text-gray-900 bg-white p-3 rounded-lg border border-emerald-100">
                    {matchedAddress.formattedAddress}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting || !matchedAddress}
                className="flex-1 rounded-2xl bg-orange-600 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
