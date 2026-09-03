'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Clock, ShieldCheck, Activity } from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch('/audit-logs?limit=50');
      if (!res.ok) throw new Error('Failed to load audit logs');
      const data = await res.json();
      setLogs(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleString();

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Platform Audit Trail &amp; Security Logs
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500">
          Immutable administrative activity log for operational governance and compliance
        </p>
      </div>

      {/* Security Status Banner */}
      <div className="rounded-2xl sm:rounded-3xl border border-purple-200 bg-purple-50/50 p-4 shadow-sm flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-purple-600 shrink-0" />
        <div className="text-xs">
          <h3 className="font-black text-purple-950">Security Audit Logging Active</h3>
          <p className="text-purple-800 text-[11px]">
            All administrative configuration changes, status overrides, and payouts are
            cryptographically recorded.
          </p>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          Recent Activity Logs ({logs.length})
        </h2>
        
        {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
        {loading && <div className="text-gray-500 text-sm">Loading audit logs...</div>}

        {/* Mobile View: Cards */}
        <div className="block md:hidden space-y-3">
          {logs.map((l: any) => (
            <div
              key={l.id}
              className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                <span className="font-black text-gray-900">{l.user?.profile?.firstName || 'System'} {l.user?.profile?.lastName || ''} ({l.user?.role || 'SYSTEM'})</span>
                <span className="text-[10px] text-gray-400 font-medium">{formatTime(l.createdAt)}</span>
              </div>

              <p className="font-bold text-purple-900">{l.action} on {l.entityName}</p>

              <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
                <span className="font-mono bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                  {l.ipAddress || 'Internal'}
                </span>
                <span className="font-bold uppercase tracking-wider text-purple-700">
                  {l.entityId}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Operator</th>
                <th className="pb-3">Action Performed</th>
                <th className="pb-3">IP Address</th>
                <th className="pb-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {logs.map((l: any) => (
                <tr key={l.id} className="hover:bg-gray-50/50">
                  <td className="py-3 font-bold text-gray-900">{l.user?.profile?.firstName || 'System'} {l.user?.profile?.lastName || ''} ({l.user?.role || 'SYSTEM'})</td>
                  <td className="py-3 text-purple-700 font-semibold">{l.action} on {l.entityName} ({l.entityId})</td>
                  <td className="py-3 text-gray-400 font-mono">{l.ipAddress || 'Internal'}</td>
                  <td className="py-3 text-gray-500 text-right">{formatTime(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

