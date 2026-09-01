'use client';

import React, { useState } from 'react';
import { Download, FileText, CheckCircle2 } from 'lucide-react';

export default function HotelReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadReport = (format: string) => {
    setDownloading(format);
    setTimeout(() => {
      const csvContent =
        'data:text/csv;charset=utf-8,Date,OrderNo,GrossSales,Commission,NetPayout\n' +
        `2026-08-17,ORD-101,450,67.5,382.5\n` +
        `2026-08-17,ORD-102,620,93.0,527.0\n`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Restaurant_Report_${format}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloading(null);
    }, 600);
  };

  const reports = [
    {
      format: 'CSV',
      title: 'Raw Orders CSV Export',
      desc: 'Line-by-line order ledger, item breakdown, quantities and customer totals.',
      btnColor: 'bg-orange-600 hover:bg-orange-700',
    },
    {
      format: 'Excel',
      title: 'Weekly Payout Statement',
      desc: 'Weekly bank disbursement statements, commission take-rates & tax receipts.',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
      format: 'PDF',
      title: 'Statutory GST Tax Summary',
      desc: 'Monthly Section 9(5) food safety tax summary document for GST compliance.',
      btnColor: 'bg-blue-600 hover:bg-blue-700',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Financial Reports &amp; Exports
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500">
          Download daily order spreadsheets, weekly payout statements &amp; statutory GST summaries
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {reports.map((r) => (
          <div
            key={r.format}
            className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-2xl bg-gray-50 text-gray-900 flex items-center justify-center font-bold">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-gray-900">{r.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
            </div>

            <button
              onClick={() => downloadReport(r.format)}
              disabled={downloading === r.format}
              className={`w-full flex items-center justify-center gap-2 rounded-2xl text-xs font-black text-white shadow-md transition min-h-[44px] ${r.btnColor}`}
            >
              <Download className="h-4 w-4" />
              <span>
                {downloading === r.format ? 'Generating...' : `Download .${r.format.toLowerCase()}`}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
