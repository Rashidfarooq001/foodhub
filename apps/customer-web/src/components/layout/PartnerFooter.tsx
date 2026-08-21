'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, ShieldCheck, PhoneCall, Mail } from 'lucide-react';
import { getHotelDashboardUrl, getDeliveryDashboardUrl } from '@foodhub/config';

export const PartnerFooter: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 bg-gray-950 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <img src="/zaykafood-logo.png" alt="ZaykaFood" className="h-8 w-auto object-contain" style={{filter: 'brightness(0) invert(1)'}} />
              <span className="text-sm font-bold text-orange-400 ml-1">Partner Network</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Empowering local restaurants and gig delivery couriers with hyper-fast dispatch, zero-hassle settlements, and real-time operations tools.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Partner Portals</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/restaurant/register" className="hover:text-orange-400">Restaurant Registration</Link></li>
              <li><Link href="/driver/register" className="hover:text-orange-400">Courier Fleet Registration</Link></li>
              <li><a href={`${getHotelDashboardUrl()}/login`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400">Merchant Login</a></li>
              <li><a href={`${getDeliveryDashboardUrl()}/login`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400">Courier Login</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Verification &amp; Compliance</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> FSSAI License Mandatory</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> GST Registration Supported</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Valid DL &amp; RC Verification</li>
              <li className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-orange-500" /> Direct Bank Payouts</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Partner Desk Support</h4>
            <div className="space-y-2 text-xs text-gray-300">
              <p className="flex items-center gap-2"><PhoneCall className="h-4 w-4 text-orange-500" /> +91-1800-ZAYKA-FOOD (Toll Free)</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-orange-500" /> partner-support@zaykafood.com</p>
              <p className="text-[10px] text-gray-500 pt-2">Mon - Sun: 8:00 AM - 11:00 PM IST</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/privacy-policy" className="hover:text-orange-400">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms-and-conditions" className="hover:text-orange-400">Terms &amp; Conditions</Link>
            <span>•</span>
            <Link href="/grievance-redressal" className="hover:text-orange-400">Grievance Redressal</Link>
          </div>
          <div>
            © {new Date().getFullYear()} Zayka Food. All Partner Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
