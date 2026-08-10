'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Plus, Trash2, CheckCircle2, X, Navigation, Home, Briefcase, Tag } from 'lucide-react';
import { useAddressStore } from '../../stores/use-address-store';
import { useAuthStore } from '../../stores/use-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

const DynamicAddressPickerMap = dynamic(
  () => import('../../components/location/AddressPickerMap').then((m) => m.AddressPickerMap),
  { ssr: false },
);

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

  const handleSave = async () => {
    if (!addressLine1.trim()) return;
    setIsSubmitting(true);

    const payload = {
      addressLabel: label,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
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
      }
    } catch {
      /* fallback store update */
      addAddress({
        label,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        latitude,
        longitude,
        isDefault: false,
      });
      setIsAddModalOpen(false);
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

  const handleLocationSelect = (lat: number, lng: number, addressStr?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (addressStr) {
      setAddressLine1(addressStr);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Saved Delivery Addresses</h1>
          <p className="text-xs text-gray-500 mt-1">Manage your home, office &amp; custom food delivery locations with live maps</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700 transition"
        >
          <Plus className="h-4 w-4" /> Add New Address
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-gray-100" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-xs font-bold text-gray-400 space-y-3">
          <MapPin className="h-10 w-10 mx-auto text-gray-300" />
          <p>No saved addresses yet. Click &quot;Add New Address&quot; above to pin your location.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative rounded-3xl border p-6 space-y-4 shadow-sm transition ${
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
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Navigation className="h-5 w-5 text-orange-600" /> Pin Delivery Location
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Interactive Leaflet Location Picker */}
            <div className="h-64 rounded-3xl overflow-hidden border border-gray-200 shadow-inner">
              <DynamicAddressPickerMap
                initialLat={latitude}
                initialLng={longitude}
                onSelectLocation={handleLocationSelect}
              />
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
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Street Address / House No. *</label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Flat 402, Sunshine Apartments, 100 Ft Road"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">PIN Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-orange-600 py-3.5 text-xs font-black text-white shadow-lg hover:bg-orange-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Saving Address...' : 'Confirm & Save Delivery Address'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
