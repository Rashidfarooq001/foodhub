'use client';

import React from 'react';
import { Download, FileText, BarChart } from 'lucide-react';

export default function HotelReportsPage() {
  const downloadReport = (format: string) => {
    alert(`Downloading Sales & Settlement Report in ${format} format...`);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Financial Reports & Exports</h1>
        <p className="text-xs text-gray-500">Download daily, weekly & monthly sales, tax & settlement reports</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <FileText className="h-8 w-8 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-900">CSV Export</h3>
          <p className="text-xs text-gray-500">Raw order transactions and line item spreadsheet.</p>
          <button
            onClick={() => downloadReport('CSV')}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-orange-700"
          >
            <Download className="h-4 w-4" /> Download .csv
          </button>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <FileText className="h-8 w-8 text-emerald-600" />
          <h3 className="text-lg font-bold text-gray-900">Excel Settlement Statement</h3>
          <p className="text-xs text-gray-500">Weekly bank settlement statements and commission fees.</p>
          <button
            onClick={() => downloadReport('Excel')}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" /> Download .xlsx
          </button>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <FileText className="h-8 w-8 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">PDF Tax Report</h3>
          <p className="text-xs text-gray-500">Monthly 5% GST tax summary document for compliance.</p>
          <button
            onClick={() => downloadReport('PDF')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
          >
            <Download className="h-4 w-4" /> Download .pdf
          </button>
        </div>
      </div>
    </div>
  );
}
