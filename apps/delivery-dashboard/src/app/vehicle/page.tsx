'use client';

import React from 'react';
import { Bike, FileCheck, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function DeliveryVehiclePage() {
  const docs = [
    { title: 'Commercial Driving License', status: 'VERIFIED', expiry: '12 Oct 2030', number: 'DL-2024-KA-8921' },
    { title: 'Vehicle RC Certificate', status: 'VERIFIED', expiry: '15 Aug 2032', number: 'KA-01-HA-9821 (TVS NTORQ)' },
    { title: 'Motor Vehicle Insurance', status: 'VERIFIED', expiry: '20 Dec 2026', number: 'POL-ICICI-881920' },
    { title: 'Pollution Certificate (PUC)', status: 'VERIFIED', expiry: '10 Nov 2026', number: 'PUC-KA-772910' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Vehicle &amp; License KYC
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500">
          Verified courier vehicle registration, RC, commercial driving license &amp; active insurance records
        </p>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-emerald-600 shrink-0" />
        <div className="text-xs">
          <h3 className="font-black text-emerald-950">Active Fleet Verification Status</h3>
          <p className="text-emerald-800 text-[11px]">All submitted transportation documents are approved and verified for delivery operations.</p>
        </div>
      </div>

      <div className="space-y-3">
        {docs.map((d) => (
          <div
            key={d.title}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-start justify-between gap-2"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <FileCheck className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-black text-gray-900">{d.title}</h4>
                <p className="text-[11px] font-mono text-gray-700">{d.number}</p>
                <p className="text-[10px] text-gray-400">Valid till {d.expiry}</p>
              </div>
            </div>

            <span className="flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-800 uppercase shrink-0">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
