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

  const isHome = pathname === '/';
  // Add bottom padding on pages with sticky bottom bars so the footer isn't covered
  const hasStickyBottomBar = pathname === '/checkout' || pathname === '/cart';

  return (
    <footer className={`bg-gray-900 text-gray-400 w-full ${isHome ? 'hidden md:block' : ''} ${hasStickyBottomBar ? 'pb-24 sm:pb-20' : 'pb-[env(safe-area-inset-bottom)]'}`}>
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-5">
        
        {/* MOBILE LAYOUT (< 768px) */}
        <div className="md:hidden flex flex-col space-y-2">
          {/* Row 1: Logo & Tagline */}
          <div className="flex items-center justify-between">
            <Link href="/">
              <img src="/zaykafood-logo.png" alt="ZaykaFood" className="h-5 w-auto object-contain" style={{filter: 'brightness(0) invert(1)'}} />
            </Link>
            <span className="text-[11px] font-medium tracking-wide">ORDER • DELIVER • ENJOY</span>
          </div>
          
          {/* Row 2: Main Nav */}
          <div className="flex justify-between items-center text-[12px] font-medium border-t border-gray-800/80 pt-2">
            <Link href="/" className="hover:text-white transition">Order</Link>
            <Link href="/partner" className="hover:text-white transition">Partner</Link>
            <Link href="/support" className="hover:text-white transition">Support</Link>
            <Link href="/profile" className="hover:text-white transition">Account</Link>
          </div>

          {/* Row 3: Legal Nav */}
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-[10px] text-gray-500 text-center leading-tight pt-1">
            <Link href="/privacy-policy" className="hover:text-orange-400">Privacy</Link> <span className="text-gray-700">|</span>
            <Link href="/terms-and-conditions" className="hover:text-orange-400">Terms</Link> <span className="text-gray-700">|</span>
            <Link href="/refund-policy" className="hover:text-orange-400">Refund</Link> <span className="text-gray-700">|</span>
            <Link href="/delivery-policy" className="hover:text-orange-400">Delivery</Link> <span className="text-gray-700">|</span>
            <Link href="/cookie-policy" className="hover:text-orange-400">Cookie</Link> <span className="text-gray-700">|</span>
            <Link href="/grievance-redressal" className="hover:text-orange-400">Grievance</Link>
          </div>

          {/* Row 4: Copyright */}
          <div className="text-center text-[9px] text-gray-600 pt-1">
            © {new Date().getFullYear()} Zayka Food. All rights reserved.
          </div>
        </div>

        {/* DESKTOP LAYOUT (>= 768px) */}
        <div className="hidden md:flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <img src="/zaykafood-logo.png" alt="ZaykaFood" className="h-6 w-auto object-contain" style={{filter: 'brightness(0) invert(1)'}} />
              </Link>
              <span className="text-xs text-gray-500 font-medium border-l border-gray-700 pl-4">ORDER • DELIVER • ENJOY</span>
            </div>
            
            <div className="flex items-center gap-6 text-xs font-medium">
              <Link href="/" className="hover:text-white transition">Order</Link>
              <Link href="/partner" className="hover:text-orange-400 transition font-bold">Become a Partner</Link>
              <Link href="/support" className="hover:text-white transition">Help & Support</Link>
              <Link href="/profile" className="hover:text-white transition">Account</Link>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-gray-800/80 pt-3">
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <Link href="/privacy-policy" className="hover:text-orange-400">Privacy Policy</Link>
              <span className="text-gray-700">•</span>
              <Link href="/terms-and-conditions" className="hover:text-orange-400">Terms & Conditions</Link>
              <span className="text-gray-700">•</span>
              <Link href="/refund-policy" className="hover:text-orange-400">Refund & Cancellation</Link>
              <span className="text-gray-700">•</span>
              <Link href="/delivery-policy" className="hover:text-orange-400">Delivery Policy</Link>
              <span className="text-gray-700">•</span>
              <Link href="/cookie-policy" className="hover:text-orange-400">Cookie Policy</Link>
              <span className="text-gray-700">•</span>
              <Link href="/grievance-redressal" className="hover:text-orange-400 font-medium">Grievance Redressal</Link>
            </div>
            <div className="text-[10px] text-gray-600">
              © {new Date().getFullYear()} Zayka Food.
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
