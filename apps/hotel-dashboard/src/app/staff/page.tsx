'use client';

import React, { useState } from 'react';
import { UserCheck, Plus, UserX } from 'lucide-react';

export default function HotelStaffPage() {
  const [staff, setStaff] = useState([
    { id: 's1', name: 'Ananya Verma', phone: '+919876543210', role: 'RESTAURANT_OWNER', active: true },
    { id: 's2', name: 'Karan Malhotra', phone: '+919876543219', role: 'RESTAURANT_MANAGER', active: true },
    { id: 's3', name: 'Suresh Kumar', phone: '+919876543218', role: 'RESTAURANT_STAFF', active: true },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Staff Management ({staff.length})</h1>
          <p className="text-xs text-gray-500">Invite staff operators, assign roles & manage KDS access permissions</p>
        </div>
        <button
          onClick={() => alert('Invite Staff Modal')}
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-black text-white shadow-lg hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" /> Invite Staff Operator
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Assigned Role</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-bold text-gray-900">{s.name}</td>
                <td className="px-6 py-4 text-gray-500">{s.phone}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black text-orange-800">
                    {s.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800">
                    ACTIVE
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
