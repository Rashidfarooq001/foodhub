'use client';

import React, { useState } from 'react';
import { Download, Calendar, FileText, Search, RefreshCw } from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

const REPORT_TYPES = [
  { id: 'sales', label: 'Sales & Revenue' },
  { id: 'orders', label: 'Order History' },
  { id: 'customers', label: 'Customer Growth' },
  { id: 'restaurants', label: 'Restaurant Yield' },
  { id: 'drivers', label: 'Driver Earnings' },
  { id: 'settlements', label: 'Settlements' },
  { id: 'coupons', label: 'Coupon Usages' },
];

interface ReportItem {
  id: string;
  date: string;
  category: string;
  title: string;
  records: number;
  totalAmount: string;
  status: string;
}

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [reportsData, setReportsData] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const rangeMap: Record<string, string> = { '7d': '7D', '30d': '30D', '90d': '90D' };
      const rangeParam = rangeMap[dateRange] || '30D';
      const res = await adminFetch(`/analytics/admin?range=${rangeParam}`);

      if (res.ok) {
        const data = await res.json();
        const generatedList: ReportItem[] = [];
        const todayStr = new Date().toISOString().slice(0, 10);

        if (data.kpi) {
          generatedList.push({
            id: `REP-REV-${rangeParam}`,
            date: todayStr,
            category: 'Sales',
            title: `Platform GMV & Revenue (${rangeParam})`,
            records: data.kpi.totalOrders || 0,
            totalAmount: `₹${(data.kpi.totalRevenue || 0).toLocaleString('en-IN')}`,
            status: 'Live',
          });

          generatedList.push({
            id: `REP-ORD-${rangeParam}`,
            date: todayStr,
            category: 'Orders',
            title: `Order Volume & Fulfillment (${rangeParam})`,
            records: data.kpi.totalOrders || 0,
            totalAmount: `₹${(data.kpi.totalRevenue || 0).toLocaleString('en-IN')}`,
            status: 'Live',
          });

          generatedList.push({
            id: `REP-SET-${rangeParam}`,
            date: todayStr,
            category: 'Settlements',
            title: `Merchant Payouts & Settlement Balance`,
            records: data.activeRestaurantsCount || 0,
            totalAmount: `₹${(data.kpi.netRevenue || 0).toLocaleString('en-IN')}`,
            status: 'Live',
          });

          generatedList.push({
            id: `REP-DRV-${rangeParam}`,
            date: todayStr,
            category: 'Drivers',
            title: `Active Delivery Fleet Activity`,
            records: data.kpi.onlineDrivers || 0,
            totalAmount: `${data.kpi.onlineDrivers || 0} active`,
            status: 'Live',
          });
        }

        setReportsData(generatedList);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
      setReportsData([]);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const handleDownload = async (id: string, type: string) => {
    setDownloading(id);
    try {
      const typeMap: Record<string, string> = {
        sales: 'revenue',
        orders: 'orders',
        customers: 'customers',
        restaurants: 'restaurants',
        drivers: 'orders',
        settlements: 'revenue',
        coupons: 'revenue',
      };
      const exportType = typeMap[type.toLowerCase()] || 'orders';
      const response = await adminFetch(`/analytics/export?type=${exportType}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportType}_export_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Reports &amp; Export Center
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Generate, inspect, and export authoritative financial and operational datasets
          </p>
        </div>

        <button
          onClick={() => handleDownload('GLOBAL', activeTab)}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-purple-500/20 transition min-h-[44px]"
        >
          <Download className="h-4 w-4" />
          <span>Export {activeTab.toUpperCase()} CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {REPORT_TYPES.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-3.5 py-2 text-xs font-black rounded-2xl transition min-h-[40px] ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search report by title or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none min-h-[44px]"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full sm:w-auto rounded-2xl border border-gray-200 bg-white py-3 px-4 text-xs font-bold text-gray-700 focus:border-purple-500 focus:outline-none min-h-[44px]"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Reports (Dual Mobile Card / Desktop Table) */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          Generated Snapshots ({reportsData.length})
        </h2>

        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-xs font-bold text-gray-400">
              Compiling real-time snapshot records...
            </p>
          </div>
        ) : reportsData.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <FileText className="mx-auto h-10 w-10 text-gray-300" />
            <p className="text-sm font-bold text-gray-700">No snapshot records found</p>
            <p className="text-xs text-gray-400">
              Operational snapshots for this period will generate as orders process.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block md:hidden space-y-3">
              {reportsData.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2">
                    <div>
                      <span className="text-xs font-black text-purple-700">{item.id}</span>
                      <h3 className="font-bold text-sm text-gray-900 mt-0.5">{item.title}</h3>
                    </div>
                    <span className="rounded-xl bg-purple-50 text-purple-700 px-2 py-0.5 text-[10px] font-black uppercase">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{item.records} rows</span>
                    <span className="font-black text-emerald-700 text-sm">{item.totalAmount}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <span className="text-[10px] text-gray-400 font-medium">{item.date}</span>
                    <button
                      onClick={() => handleDownload(item.id, activeTab)}
                      disabled={downloading === item.id}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1 min-h-[36px]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{downloading === item.id ? 'Exporting...' : 'Download CSV'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Report ID</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Report Title</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Records</th>
                    <th className="pb-3">Volume</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {reportsData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-black text-purple-700">{item.id}</td>
                      <td className="py-3 text-gray-500">{item.date}</td>
                      <td className="py-3 font-bold text-gray-900">{item.title}</td>
                      <td className="py-3">
                        <span className="rounded-lg bg-purple-50 px-2 py-0.5 font-bold text-purple-700 text-[10px] uppercase">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">{item.records} rows</td>
                      <td className="py-3 font-black text-emerald-700">{item.totalAmount}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDownload(item.id, activeTab)}
                          disabled={downloading === item.id}
                          className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>{downloading === item.id ? 'Exporting...' : 'CSV'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
