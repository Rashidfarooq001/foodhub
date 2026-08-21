'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PartnerFooter } from './PartnerFooter';

export const Footer: React.FC = () => {
  const pathname = usePathname();

  if (pathname?.startsWith('/restaurant/register') || pathname?.startsWith('/driver/register')) {
    return <PartnerFooter />;
  }

  return (
    <footer className="border-t border-gray-100 bg-gray-900 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Logo + Tagline */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <img src="/zaykafood-logo.png" alt="ZaykaFood" className="h-8 w-auto object-contain" style={{filter: 'brightness(0) invert(1)'}} />
          </Link>
          <p className="mt-2 text-sm text-gray-400">ORDER • DELIVER • ENJOY</p>
        </div>

        {/* Navigation & Partner Links */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm mb-4">
          <Link href="/support" className="hover:text-orange-400 transition">Help &amp; Support</Link>
          <Link href="/support" className="hover:text-orange-400 transition">Contact Us</Link>
          <Link
            href="/partner"
            className="font-bold text-orange-400 hover:text-orange-300 transition"
          >
            Become a Partner
          </Link>
        </div>

        {/* Legal & Policy Links */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-500 mb-6 border-t border-gray-800/80 pt-4">
          <Link href="/privacy-policy" className="hover:text-orange-400 transition">Privacy Policy</Link>
          <span className="text-gray-700 hidden sm:inline">•</span>
          <Link href="/terms-and-conditions" className="hover:text-orange-400 transition">Terms &amp; Conditions</Link>
          <span className="text-gray-700 hidden sm:inline">•</span>
          <Link href="/refund-policy" className="hover:text-orange-400 transition">Refund &amp; Cancellation</Link>
          <span className="text-gray-700 hidden sm:inline">•</span>
          <Link href="/delivery-policy" className="hover:text-orange-400 transition">Delivery Policy</Link>
          <span className="text-gray-700 hidden sm:inline">•</span>
          <Link href="/cookie-policy" className="hover:text-orange-400 transition">Cookie Policy</Link>
          <span className="text-gray-700 hidden sm:inline">•</span>
          <Link href="/grievance-redressal" className="hover:text-orange-400 transition font-medium">Grievance Redressal</Link>
        </div>

        {/* Operating Entity & Copyright */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>Zayka Food • Hyper-local Food Delivery Marketplace • Kehnusa, Bandipora, Jammu &amp; Kashmir</p>
          <p className="text-[11px] text-gray-600">
            © {new Date().getFullYear()} Zayka Food. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
