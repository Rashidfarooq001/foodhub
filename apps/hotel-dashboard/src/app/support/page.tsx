'use client';

import React from 'react';
import { HelpCircle, Phone, Mail } from 'lucide-react';

export default function HotelSupportPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Merchant Support</h1>
        <p className="text-xs text-gray-500">Contact FoodHub Partner Helpdesk & account managers</p>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <Phone className="h-6 w-6 text-orange-600" />
          <div>
            <h4 className="text-base font-bold text-gray-900">Merchant Helpline</h4>
            <p className="text-xs text-gray-500">+91 1800-419-7700 (Merchant Desk)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
