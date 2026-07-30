'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Building2, Bike, HelpCircle, LogIn, ChevronDown } from 'lucide-react';

export const PartnerHeader: React.FC = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md transition-all shadow-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Partner Network Badge */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-gray-900">
              Food<span className="text-orange-600">Hub</span>
            </span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700 border border-orange-200">
            <Building2 className="h-3.5 w-3.5" /> Partner Network
          </span>
        </div>

        {/* Right Actions: Partner Login & Contact Support */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/support"
            className="flex items-center gap-2 rounded-xl bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
          >
            <HelpCircle className="h-4 w-4 text-orange-600" />
            <span>Help / Contact Support</span>
          </Link>

          {/* Partner Login Menu */}
          <div className="relative">
            <button
              onClick={() => setIsLoginOpen(!isLoginOpen)}
              className="flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-gray-800 transition"
            >
              <LogIn className="h-4 w-4 text-orange-400" />
              <span>Partner Login</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {isLoginOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl z-50">
                <div className="border-b border-gray-100 p-3">
                  <p className="text-xs font-black uppercase text-gray-400 tracking-wider">Partner Access Portals</p>
                </div>
                <div className="py-1 space-y-1">
                  <a
                    href={`${process.env.NEXT_PUBLIC_HOTEL_DASHBOARD_URL || 'http://localhost:3001'}/login`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Building2 className="h-4 w-4 text-orange-600" />
                    <div>
                      <span className="block">Restaurant Merchant Dashboard</span>
                      <span className="block text-[10px] font-normal text-gray-400">Order queue &amp; store settings</span>
                    </div>
                  </a>
                  <a
                    href={`${process.env.NEXT_PUBLIC_DELIVERY_DASHBOARD_URL || 'http://localhost:3002'}/login`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <Bike className="h-4 w-4 text-emerald-600" />
                    <div>
                      <span className="block">Delivery Fleet Dashboard</span>
                      <span className="block text-[10px] font-normal text-gray-400">Duty dispatches &amp; earnings</span>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
