'use client';

import React from 'react';
import { useDutyStore, DutyStatus } from '../../stores/use-duty-store';
import { Power, CheckCircle2 } from 'lucide-react';

export default function DeliveryAvailabilityPage() {
  const { dutyStatus, setDutyStatus } = useDutyStore();

  const statuses: { label: string; value: DutyStatus; desc: string }[] = [
    { label: 'ONLINE', value: 'ONLINE', desc: 'Active & ready to accept incoming orders' },
    { label: 'ON BREAK', value: 'BREAK', desc: 'Pause order dispatches for 30 minutes' },
    { label: 'BUSY', value: 'BUSY', desc: 'Currently delivering an active order' },
    { label: 'OFFLINE', value: 'OFFLINE', desc: 'End duty shift' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Duty Availability Status</h1>
        <p className="text-xs text-gray-500">Manage real-time online/offline duty status</p>
      </div>

      <div className="space-y-3">
        {statuses.map((s) => (
          <div
            key={s.value}
            onClick={() => setDutyStatus(s.value)}
            className={`cursor-pointer rounded-3xl border p-6 flex items-center justify-between transition ${
              dutyStatus === s.value
                ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                : 'border-gray-100 bg-white'
            }`}
          >
            <div>
              <h4 className="text-base font-bold text-gray-900">{s.label}</h4>
              <p className="text-xs text-gray-500">{s.desc}</p>
            </div>
            {dutyStatus === s.value && <CheckCircle2 className="h-6 w-6 text-emerald-600" />}
          </div>
        ))}
      </div>
    </div>
  );
}
