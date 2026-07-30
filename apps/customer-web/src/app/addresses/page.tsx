'use client';

import React, { useState } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, X } from 'lucide-react';
import { useAddressStore } from '../../stores/use-address-store';

export default function AddressesPage() {
  const { addresses, selectedAddressId, setSelectedAddress, addAddress, removeAddress } = useAddressStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [label, setLabel] = useState('Home');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('Bengaluru');

  const handleSave = () => {
    if (!addressLine1) return;
    addAddress({
      label,
      addressLine1,
      city,
      state: 'Karnataka',
      postalCode: '560038',
      latitude: 12.9716,
      longitude: 77.5946,
      isDefault: false,
    });
    setIsAddModalOpen(false);
    setAddressLine1('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Saved Addresses</h1>
          <p className="text-xs text-gray-500">Manage your home, office, and delivery locations</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" /> Add Address
        </button>
      </div>

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
                <MapPin className="h-4 w-4 text-orange-600" /> {addr.label}
              </div>
              {selectedAddressId === addr.id && (
                <span className="flex items-center gap-1 text-xs font-bold text-orange-600">
                  <CheckCircle2 className="h-4 w-4" /> Active
                </span>
              )}
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}{addr.city}, {addr.state} - {addr.postalCode}
            </p>

            <div className="flex justify-between border-t border-gray-100 pt-3 text-xs font-bold">
              <button
                onClick={() => setSelectedAddress(addr.id)}
                className="text-orange-600 hover:underline"
              >
                Set as Active
              </button>
              <button
                onClick={() => removeAddress(addr.id)}
                className="text-gray-400 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Address Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">Add New Delivery Address</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">Address Label</label>
              <div className="flex gap-2">
                {['Home', 'Work', 'Other'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLabel(l)}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold border transition ${
                      label === l ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <label className="block text-xs font-bold text-gray-700">Flat / House / Street Address</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Flat 101, Sunshine Heights"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs text-gray-900 focus:border-orange-500 focus:outline-none"
              />

              <label className="block text-xs font-bold text-gray-700">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full rounded-2xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-orange-700"
            >
              Save Address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
