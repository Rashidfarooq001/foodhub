'use client';

import React from 'react';
import { Phone, ShieldAlert, ShieldCheck, HelpCircle, Navigation } from 'lucide-react';

export default function DeliverySupportPage() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Courier SOS &amp; Fleet Helpdesk
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500">
          Emergency rider assistance, dispatch escalation &amp; trip dispute resolution
        </p>
      </div>

      {/* Emergency Hotline */}
      <div className="rounded-2xl sm:rounded-3xl border border-rose-200 bg-rose-50/60 p-4 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-rose-800 font-bold uppercase block">Emergency Rider Support</span>
            <h2 className="text-base sm:text-lg font-black text-rose-950">Active Trip SOS Helpline</h2>
          </div>
        </div>

        <p className="text-xs text-rose-800 font-medium leading-relaxed">
          If you have encountered a road incident, customer dispute, or vehicle breakdown during an active delivery trip:
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-rose-200 text-xs">
          <div>
            <span className="font-bold text-gray-900 block">Fleet Operations Desk</span>
            <span className="text-gray-500 font-mono">businesscity05@gmail.com</span>
          </div>
          <a
            href="mailto:businesscity05@gmail.com?subject=Rider%20SOS%20Emergency%20Escalation"
            className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 py-2.5 px-5 text-xs font-black text-white shadow-md shadow-rose-600/30 transition whitespace-nowrap"
          >
            <span>Email Dispatch SOS</span>
          </a>
        </div>
      </div>

      {/* FAQs */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-3">
        <h3 className="text-sm sm:text-base font-black text-gray-900">Rider FAQs &amp; Guidance</h3>

        <div className="space-y-2.5 text-xs text-gray-700">
          <div className="p-3 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
            <h4 className="font-bold text-gray-900">What if customer address is unreachable?</h4>
            <p className="text-gray-600 text-[11px]">Attempt calling the customer twice. If unreachable after 5 minutes, trigger dispatch escalation in Active Trip console.</p>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
            <h4 className="font-bold text-gray-900">How do customer tips get credited?</h4>
            <p className="text-gray-600 text-[11px]">100% of customer tips are credited directly to your payout ledger with zero platform deduction.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
