import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Home, Utensils, Search, LifeBuoy } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Page Not Found | Zayka Food',
  description: 'The page you are looking for could not be found on Zayka Food.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 font-black text-3xl shadow-sm">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight sm:text-3xl">
            Page Not Found
          </h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-700 transition"
          >
            <Home className="h-4 w-4" /> Home
          </Link>
          <Link
            href="/restaurants"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            <Utensils className="h-4 w-4" /> Restaurants
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            <Search className="h-4 w-4" /> Search
          </Link>
          <Link
            href="/support"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            <LifeBuoy className="h-4 w-4" /> Support
          </Link>
        </div>
      </div>
    </div>
  );
}
