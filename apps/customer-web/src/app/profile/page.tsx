'use client';

import React, { useState } from 'react';
import { User, Phone, Mail, Camera, Save, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstName || 'Rahul');
  const [lastName, setLastName] = useState(user?.lastName || 'Sharma');
  const [email, setEmail] = useState(user?.email || 'rahul.sharma@example.com');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ firstName, lastName, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Your Account Profile</h1>
        <p className="text-xs text-gray-500">Update personal details & communication preferences</p>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={user?.firstName}
              className="h-24 w-24 rounded-full object-cover border-4 border-orange-500 shadow-md"
            />
            <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white shadow-md">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h3>
            <p className="text-xs text-gray-500">{user?.phone}</p>
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4" /> Profile updated successfully!
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number (Verified)</label>
            <input
              type="text"
              disabled
              value={user?.phone || '+919876543210'}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-500 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-orange-700"
          >
            <Save className="h-4 w-4" /> Save Profile Changes
          </button>
        </form>
      </div>
    </div>
  );
}
