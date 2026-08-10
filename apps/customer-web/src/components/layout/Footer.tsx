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
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-600 text-white">
              <span className="text-sm font-black">F</span>
            </div>
            <span className="text-xl font-black text-white">
              Food<span className="text-orange-500">Hub</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-gray-400">Fresh meals from top local restaurants, fast.</p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm mb-6">
          <Link href="/support" className="hover:text-orange-400 transition">Help</Link>
          <Link href="/support" className="hover:text-orange-400 transition">Contact</Link>
          <a
            href={`${process.env.NEXT_PUBLIC_HOTEL_DASHBOARD_URL || 'https://foodhub-hotel-dashboard.vercel.app'}/partner/register`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-orange-400 hover:text-orange-300 transition"
          >
            Become a Partner
          </a>
          <a href="#" className="hover:text-orange-400 transition">Privacy</a>
          <a href="#" className="hover:text-orange-400 transition">Terms</a>
        </div>

        {/* Copyright */}
        <p className="text-center text-xs text-gray-600">
          © {new Date().getFullYear()} FoodHub. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
