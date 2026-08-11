'use client';

import React from 'react';
import Link from 'next/link';
import { Store, Bike, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getApiBaseUrl, getHotelDashboardUrl, getDeliveryDashboardUrl } from '@foodhub/config';

export default function PartnerLandingPage() {
  const hotelRegUrl = '/restaurant/register';
  const deliveryRegUrl = '/driver/register';

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-16 text-white flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-400 border border-orange-500/20">
          <ShieldCheck className="h-4 w-4" /> FoodHub Partner Network
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">Become a FoodHub Partner</h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
          Choose how you want to partner with FoodHub. Expand your food business or earn on flexible hours as a delivery partner.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* CARD 1: RESTAURANT PARTNER */}
        <div className="rounded-3xl border border-gray-800 bg-gray-800/50 p-8 flex flex-col justify-between hover:border-orange-500/50 transition group">
          <div className="space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
              <Store className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Restaurant Partner</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Register your restaurant, hotel, or cloud kitchen. Get listed on FoodHub, manage live KDS orders, and grow your customer base.
            </p>
            <ul className="space-y-2 text-xs font-semibold text-gray-300 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" /> Live Kitchen Display System (KDS)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" /> Menu &amp; Price Item Controls
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" /> Automated Revenue Settlements
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link
              href={hotelRegUrl}
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-orange-600 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/20 hover:bg-orange-500 transition"
            >
              <span>Register Your Restaurant</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* CARD 2: DELIVERY PARTNER */}
        <div className="rounded-3xl border border-gray-800 bg-gray-800/50 p-8 flex flex-col justify-between hover:border-emerald-500/50 transition group">
          <div className="space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Bike className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Delivery Partner</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Join FoodHub as a delivery courier. Deliver meals on your own schedule with weekly payouts, insurance &amp; trip bonuses.
            </p>
            <ul className="space-y-2 text-xs font-semibold text-gray-300 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Flexible Work Hours &amp; Duty Toggles
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Real-time GPS Trip Dispatches
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Direct Wallet Payouts &amp; Withdrawals
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link
              href={deliveryRegUrl}
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-emerald-600 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition"
            >
              <span>Join as Delivery Partner</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
