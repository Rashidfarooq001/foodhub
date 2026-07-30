'use client';

import React from 'react';
import { Phone, ShieldCheck } from 'lucide-react';

export default function DeliverySupportPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Courier SOS & Support</h1>
        <p className="text-xs text-gray-500">Emergency support & dispatch hotline</p>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-4">
        <Phone className="h-8 w-8 text-emerald-600" />
        <div>
          <h4 className="text-base font-bold text-gray-900">Emergency Driver Helpline</h4>
          <p className="text-xs text-gray-500">+91 1800-419-6600 (Driver Hotline)</p>
        </div>
      </div>
    </div>
  );
}
