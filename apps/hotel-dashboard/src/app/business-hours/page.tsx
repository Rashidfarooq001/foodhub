'use client';

import React, { useState } from 'react';
import { Clock, Save, CheckCircle2 } from 'lucide-react';

export default function HotelBusinessHoursPage() {
  const [hours, setHours] = useState([
    { day: 'Monday', open: '09:00 AM', close: '11:00 PM', isClosed: false },
    { day: 'Tuesday', open: '09:00 AM', close: '11:00 PM', isClosed: false },
    { day: 'Wednesday', open: '09:00 AM', close: '11:00 PM', isClosed: false },
    { day: 'Thursday', open: '09:00 AM', close: '11:00 PM', isClosed: false },
    { day: 'Friday', open: '09:00 AM', close: '11:30 PM', isClosed: false },
    { day: 'Saturday', open: '09:00 AM', close: '11:30 PM', isClosed: false },
    { day: 'Sunday', open: '09:00 AM', close: '11:30 PM', isClosed: false },
  ]);

  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Working Hours Matrix</h1>
        <p className="text-xs text-gray-500">Set daily opening & closing times for automatic order reception</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4" /> Operating hours updated successfully!
        </div>
      )}

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        {hours.map((h, idx) => (
          <div key={h.day} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
            <span className="text-xs font-bold text-gray-900 w-28">{h.day}</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={h.open}
                onChange={(e) => {
                  const updated = [...hours];
                  updated[idx].open = e.target.value;
                  setHours(updated);
                }}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-800"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="text"
                value={h.close}
                onChange={(e) => {
                  const updated = [...hours];
                  updated[idx].close = e.target.value;
                  setHours(updated);
                }}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-800"
              />
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-orange-700 mt-4"
        >
          <Save className="h-4 w-4" /> Save Operating Hours
        </button>
      </div>
    </div>
  );
}
