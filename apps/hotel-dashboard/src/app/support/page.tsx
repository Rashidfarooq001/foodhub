'use client';

import React from 'react';
import { Phone, Mail, MessageSquare, HelpCircle, ShieldCheck } from 'lucide-react';

export default function HotelSupportPage() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Merchant Helpdesk &amp; Support
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500">
          Contact ZaykaFood restaurant partner desk, resolve payout queries &amp; kitchen technical assistance
        </p>
      </div>

      {/* Support Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <a
          href="tel:+9118004197700"
          className="rounded-2xl sm:rounded-3xl border border-orange-200 bg-orange-50/50 p-4 sm:p-5 shadow-sm space-y-3 hover:bg-orange-100/60 transition block"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold shrink-0">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-orange-800 font-bold uppercase block">Toll-Free Priority Desk</span>
              <h3 className="text-sm sm:text-base font-black text-orange-950">+91 1800-419-7700</h3>
            </div>
          </div>
          <p className="text-xs text-orange-800 font-medium">Available 24/7 for live order dispatch and kitchen emergency assistance.</p>
        </a>

        <a
          href="mailto:partner-support@zaykafood.com"
          className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-3 hover:bg-gray-50 transition block"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Email Partner Operations</span>
              <h3 className="text-xs sm:text-sm font-black text-gray-900">partner-support@zaykafood.com</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500 font-medium">Settlement dispute inquiries, menu catalog changes and store profile updates.</p>
        </a>
      </div>

      {/* FAQs */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-3">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          Frequently Asked Questions
        </h2>

        <div className="space-y-2.5 text-xs text-gray-700">
          <div className="p-3 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
            <h4 className="font-bold text-gray-900">When are weekly merchant settlements disbursed?</h4>
            <p className="text-gray-600 text-[11px]">Payouts are automatically aggregated Sunday midnight and directly transferred via NEFT/IMPS on Monday mornings.</p>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
            <h4 className="font-bold text-gray-900">How do I toggle item out-of-stock?</h4>
            <p className="text-gray-600 text-[11px]">Go to the Menu Catalog tab and switch the availability toggle next to the dish. Changes reflect in real-time on customer apps.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
