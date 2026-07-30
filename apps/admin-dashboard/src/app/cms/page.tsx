'use client';

import React from 'react';
import { FileCode, Image, Plus } from 'lucide-react';

export default function AdminCmsPage() {
  const banners = [
    { id: 'b1', title: '50% OFF Weekend Craze', subtitle: 'Valid on orders above ₹199', active: true },
    { id: 'b2', title: 'Free Delivery Special', subtitle: 'Zero delivery fee on top rated kitchens', active: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">CMS & Homepage Banners</h1>
          <p className="text-xs text-gray-500">Manage customer app hero offer banners, FAQs & marketing content</p>
        </div>
        <button onClick={() => alert('Add Banner Modal')} className="flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs font-black text-white shadow-lg">
          <Plus className="h-4 w-4" /> Add Hero Banner
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {banners.map((b) => (
          <div key={b.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
            <h3 className="text-base font-bold text-gray-900">{b.title}</h3>
            <p className="text-xs text-gray-500">{b.subtitle}</p>
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-black text-emerald-800">
              ACTIVE ON HOME FEED
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
