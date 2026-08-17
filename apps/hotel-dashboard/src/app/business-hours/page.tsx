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
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Working Hours Matrix
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500">
          Set daily opening &amp; closing schedules for automated kitchen order reception
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Operating hours updated successfully!</span>
        </div>
      )}

      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <div className="space-y-3">
          {hours.map((h, idx) => (
            <div
              key={h.day}
              className="p-3 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <span className="text-xs font-black text-gray-900">{h.day}</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={h.open}
                  onChange={(e) => {
                    const updated = [...hours];
                    updated[idx].open = e.target.value;
                    setHours(updated);
                  }}
                  className="flex-1 sm:w-28 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 text-center min-h-[40px]"
                />
                <span className="text-xs text-gray-400 font-bold">to</span>
                <input
                  type="text"
                  value={h.close}
                  onChange={(e) => {
                    const updated = [...hours];
                    updated[idx].close = e.target.value;
                    setHours(updated);
                  }}
                  className="flex-1 sm:w-28 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 text-center min-h-[40px]"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-700 px-6 py-3.5 text-xs font-black text-white shadow-md shadow-orange-500/20 transition min-h-[44px]"
        >
          <Save className="h-4 w-4" />
          <span>Save Operating Schedule</span>
        </button>
      </div>
    </div>
  );
}
