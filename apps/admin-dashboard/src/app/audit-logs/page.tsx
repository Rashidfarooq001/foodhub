'use client';

import React from 'react';
import { Shield, Clock } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const logs = [
    { id: 'l1', user: 'Dr. Rashid Farooq', action: 'Approved Merchant #REST-94810 (Tandoori Junction)', ip: '192.168.1.1', time: '10 mins ago' },
    { id: 'l2', user: 'Finance Operator', action: 'Initiated Weekly Settlement ₹3,97,700', ip: '192.168.1.4', time: '1 hour ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Platform Audit Trail & Security Logs</h1>
        <p className="text-xs text-gray-500">Immutable administrative activity log for security compliance</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Operator</th>
              <th className="px-6 py-4">Action Performed</th>
              <th className="px-6 py-4">IP Address</th>
              <th className="px-6 py-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-bold text-gray-900">{l.user}</td>
                <td className="px-6 py-4 text-purple-700 font-medium">{l.action}</td>
                <td className="px-6 py-4 text-gray-400 font-mono">{l.ip}</td>
                <td className="px-6 py-4 text-gray-500">{l.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
