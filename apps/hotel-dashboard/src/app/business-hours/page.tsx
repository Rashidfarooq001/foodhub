'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';

const DAYS = [
  { day: 'Monday', dayOfWeek: 1 },
  { day: 'Tuesday', dayOfWeek: 2 },
  { day: 'Wednesday', dayOfWeek: 3 },
  { day: 'Thursday', dayOfWeek: 4 },
  { day: 'Friday', dayOfWeek: 5 },
  { day: 'Saturday', dayOfWeek: 6 },
  { day: 'Sunday', dayOfWeek: 0 },
];

export default function HotelBusinessHoursPage() {
  const { user, accessToken } = useHotelAuthStore();
  const restaurantId = user?.restaurantId;

  const [hours, setHours] = useState(
    DAYS.map((d) => ({
      day: d.day,
      dayOfWeek: d.dayOfWeek,
      open: '09:00 AM',
      close: '11:00 PM',
      isClosed: true,
    })),
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimings = async () => {
      if (!restaurantId) {
        setIsLoading(false);
        return;
      }

      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/restaurants/${restaurantId}/timings`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const updated = DAYS.map((d) => {
              const found = data.find((t: any) => t.dayOfWeek === d.dayOfWeek);
              return {
                day: d.day,
                dayOfWeek: d.dayOfWeek,
                open: found?.openTime || '09:00 AM',
                close: found?.closeTime || '11:00 PM',
                isClosed: found?.isClosed ?? false,
              };
            });
            setHours(updated);
          }
        }
      } catch (err) {
        console.error('Failed to load timings', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimings();
  }, [restaurantId, accessToken]);

  const handleSave = async () => {
    if (!restaurantId || isSaving) return;
    setIsSaving(true);
    setErrorMsg(null);
    setSavedMsg(null);

    try {
      const apiBase = getApiBaseUrl();
      const payload = hours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        openTime: h.open.trim(),
        closeTime: h.close.trim(),
        isClosed: h.isClosed,
      }));

      const res = await fetch(`${apiBase}/restaurants/${restaurantId}/timings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to update business hours');
      }

      setSavedMsg('Operating hours updated successfully in the system!');
      setTimeout(() => setSavedMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save operating schedule');
    } finally {
      setIsSaving(false);
    }
  };

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

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3.5 text-xs font-bold text-rose-700 border border-rose-200 shadow-sm">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-xs font-bold text-gray-400">Loading operating schedule...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hours.map((h, idx) => (
              <div
                key={h.day}
                className="p-3 sm:p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-gray-900">{h.day}</span>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 sm:hidden">Opening</span>
                    <input
                      type="text"
                      value={h.open}
                      onChange={(e) => {
                        const updated = [...hours];
                        updated[idx].open = e.target.value;
                        setHours(updated);
                      }}
                      className="w-full sm:w-32 min-w-0 rounded-xl border border-gray-200 bg-white px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-bold text-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                  <span className="text-xs text-gray-400 font-bold mt-4 sm:mt-0">to</span>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 sm:hidden">Closing</span>
                    <input
                      type="text"
                      value={h.close}
                      onChange={(e) => {
                        const updated = [...hours];
                        updated[idx].close = e.target.value;
                        setHours(updated);
                      }}
                      className="w-full sm:w-32 min-w-0 rounded-xl border border-gray-200 bg-white px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-bold text-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-700 px-6 py-3.5 text-xs font-black text-white shadow-md shadow-orange-500/20 transition min-h-[44px] disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Saving...' : 'Save Operating Schedule'}</span>
        </button>
      </div>
    </div>
  );
}
