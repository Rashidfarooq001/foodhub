'use client';

import React, { useState } from 'react';
import { Download, Calendar, Filter, FileText, Search } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

const REPORT_TYPES = [
  { id: 'sales', label: 'Sales & Revenue' },
  { id: 'orders', label: 'Order History' },
  { id: 'customers', label: 'Customer Growth' },
  { id: 'restaurants', label: 'Restaurant Yield' },
  { id: 'drivers', label: 'Driver Earnings' },
  { id: 'settlements', label: 'Settlements' },
  { id: 'coupons', label: 'Coupon Usages' },
];

const MOCK_REPORTS_DATA = [
  { id: 'REP-101', date: '2026-07-29', category: 'Sales', title: 'Daily Revenue Breakdown', records: 312, totalAmount: '₹1,32,600', status: 'Generated' },
  { id: 'REP-102', date: '2026-07-28', category: 'Orders', title: 'Completed Orders Audit', records: 298, totalAmount: '₹1,21,400', status: 'Generated' },
  { id: 'REP-103', date: '2026-07-27', category: 'Settlements', title: 'Weekly Restaurant Payouts', records: 45, totalAmount: '₹4,85,000', status: 'Generated' },
  { id: 'REP-104', date: '2026-07-26', category: 'Coupons', title: 'Discount Usage Summary', records: 114, totalAmount: '₹14,250', status: 'Generated' },
  { id: 'REP-105', date: '2026-07-25', category: 'Drivers', title: 'Weekly Driver Incentives', records: 88, totalAmount: '₹44,000', status: 'Generated' },
];

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (id: string, type: string) => {
    setDownloading(id);
    try {
      const response = await fetch(`${API_BASE}/analytics/export?type=${type}`);
      if (!response.ok) {
        // Fallback CSV download for UI demo if backend offline
        const csvContent = "data:text/csv;charset=utf-8,ID,Date,Category,Title,Records,TotalAmount\n"
          + `${id},2026-07-29,${type},Exported Report,300,100000`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${type}_report_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_report_${Date.now()}.csv`;
        a.click();
      }
    } catch {
      // Fallback CSV download
      const csvContent = "data:text/csv;charset=utf-8,ID,Date,Category,Title,Records,TotalAmount\n"
        + `${id},2026-07-29,${type},Exported Report,300,100000`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${type}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setDownloading(null), 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Reports & Export Center</h1>
          <p className="text-xs text-gray-500">Generate, view, and export financial, operational & ecosystem reports</p>
        </div>
        <button
          onClick={() => handleDownload('GLOBAL', activeTab)}
          className="flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-xs font-black text-white shadow-lg hover:bg-purple-700 transition-all self-start"
        >
          <Download className="h-4 w-4" />
          Export {activeTab.toUpperCase()} CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {REPORT_TYPES.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-xs font-bold rounded-2xl transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search report by title or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 py-2 pl-10 pr-4 text-xs outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Calendar className="h-4 w-4 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-2xl border border-gray-200 py-2 px-3 text-xs font-bold text-gray-700 outline-none bg-white"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Report ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Report Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Records</th>
                <th className="px-6 py-4">Volume / Amount</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
              {MOCK_REPORTS_DATA.map((item) => (
                <tr key={item.id} className="hover:bg-purple-50/50 transition-colors">
                  <td className="px-6 py-4 font-black text-purple-600">{item.id}</td>
                  <td className="px-6 py-4">{item.date}</td>
                  <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    {item.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-xl bg-purple-50 px-2.5 py-1 font-bold text-purple-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.records} rows</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{item.totalAmount}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDownload(item.id, activeTab)}
                      disabled={downloading === item.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-bold text-gray-700 hover:bg-gray-50 hover:text-purple-600 transition-colors disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {downloading === item.id ? 'Exporting...' : 'CSV'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
