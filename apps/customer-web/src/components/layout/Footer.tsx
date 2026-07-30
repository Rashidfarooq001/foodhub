'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Heart } from 'lucide-react';
import { PartnerFooter } from './PartnerFooter';

export const Footer: React.FC = () => {
  const pathname = usePathname();

  if (pathname?.startsWith('/restaurant/register') || pathname?.startsWith('/driver/register')) {
    return <PartnerFooter />;
  }
  return (
    <footer className="border-t border-gray-100 bg-gray-900 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-2xl font-black text-white">
                Food<span className="text-orange-500">Hub</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              FoodHub delivers fresh, piping-hot meals from top-rated local restaurants right to your doorstep with hyper-fast dispatch.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/restaurants" className="hover:text-orange-400">Restaurants</Link></li>
              <li><Link href="/categories" className="hover:text-orange-400">Categories</Link></li>
              <li><Link href="/coupons" className="hover:text-orange-400">Offers & Coupons</Link></li>
              <li><Link href="/search" className="hover:text-orange-400">Search Food</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/support" className="hover:text-orange-400">Customer Support</Link></li>
              <li><a href="#" className="hover:text-orange-400">Partner With Us</a></li>
              <li><a href="#" className="hover:text-orange-400">Terms of Service</a></li>
              <li><a href="#" className="hover:text-orange-400">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Apps */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Get FoodHub App</h4>
            <p className="mb-4 text-xs text-gray-400">Fastest food ordering on iOS & Android.</p>
            <div className="space-y-2">
              <div className="flex h-11 cursor-pointer items-center justify-center rounded-xl bg-gray-800 px-4 text-xs font-bold text-white transition hover:bg-gray-700">
                App Store (iOS)
              </div>
              <div className="flex h-11 cursor-pointer items-center justify-center rounded-xl bg-gray-800 px-4 text-xs font-bold text-white transition hover:bg-gray-700">
                Google Play Store
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-gray-800 pt-8 sm:flex-row">
          <p className="text-xs text-gray-500">
            © 2026 FoodHub Technologies Inc. All rights reserved.
          </p>
          <p className="mt-2 flex items-center gap-1 text-xs text-gray-500 sm:mt-0">
            Crafted with <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" /> for food lovers.
          </p>
        </div>
      </div>
    </footer>
  );
};
