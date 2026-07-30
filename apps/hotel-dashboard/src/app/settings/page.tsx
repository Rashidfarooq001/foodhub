'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { MediaUploader } from '../../components/common/MediaUploader';

export default function HotelSettingsPage() {
  const [name, setName] = useState('Spice Garden Restaurant');
  const [phone, setPhone] = useState('+919876543210');
  const [fssai, setFssai] = useState('11223344556677');
  const [gstin, setGstin] = useState('29ABCDE1234F1Z5');
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80');
  const [bannerUrl, setBannerUrl] = useState('');
  const [promoVideoUrl, setPromoVideoUrl] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl pb-12">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Restaurant Settings</h1>
        <p className="text-xs text-gray-500">Update store profile, media assets, FSSAI license &amp; GSTIN</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4" /> Store profile &amp; media assets updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Restaurant Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Store Phone Number</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* Media Upload Section */}
        <div className="border-t border-b border-gray-100 py-4 space-y-4">
          <h3 className="text-sm font-black text-gray-900">Brand Media &amp; Promo Assets</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MediaUploader
              label="Restaurant Logo (JPG, PNG, WEBP max 5MB)"
              acceptType="image"
              value={logoUrl}
              onChange={setLogoUrl}
            />
            <MediaUploader
              label="Store Banner Image (max 5MB)"
              acceptType="image"
              value={bannerUrl}
              onChange={setBannerUrl}
            />
          </div>
          <MediaUploader
            label="Promotional Video (MP4, MOV, WEBM max 100MB)"
            acceptType="video"
            value={promoVideoUrl}
            onChange={setPromoVideoUrl}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">FSSAI License No.</label>
            <input
              type="text"
              value={fssai}
              onChange={(e) => setFssai(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">GSTIN Number</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-orange-700 mt-4"
        >
          <Save className="h-4 w-4" /> Save Settings &amp; Media
        </button>
      </form>
    </div>
  );
}
