'use client';

import React from 'react';
import { Bike, FileCheck, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function DeliveryVehiclePage() {
  const docs = [
    { title: 'Driving License', status: 'VERIFIED', expiry: '12 Oct 2030' },
    { title: 'Vehicle RC (KA-01-HA-9821)', status: 'VERIFIED', expiry: '15 Aug 2032' },
    { title: 'Vehicle Insurance', status: 'VERIFIED', expiry: '20 Dec 2026' },
    { title: 'Pollution Certificate (PUC)', status: 'VERIFIED', expiry: '10 Nov 2026' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Vehicle & License KYC</h1>
        <p className="text-xs text-gray-500">Verified vehicle registration, RC, driving license & insurance status</p>
      </div>

      <div className="space-y-4">
        {docs.map((d) => (
          <div key={d.title} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCheck className="h-6 w-6 text-emerald-600" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">{d.title}</h4>
                <p className="text-[10px] text-gray-400">Valid till {d.expiry}</p>
              </div>
            </div>

            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
