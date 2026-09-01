'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckSquare, Store, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AddRestaurantPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 max-w-3xl mx-auto py-12">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-2"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Restaurants List
      </button>

      <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-8 shadow-sm text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900">Manual Admin Onboarding Deprecated</h1>
          <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
            Direct manual creation of restaurant accounts by administrators is disabled. All new
            restaurant partners must self-register using the{' '}
            <span className="font-bold text-gray-900">"Become a Partner"</span> onboarding form.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/restaurants/approval"
            className="flex items-center gap-2 rounded-2xl bg-purple-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-purple-700 transition"
          >
            <CheckSquare className="h-4 w-4" />
            <span>Review Pending Restaurant Applications</span>
          </Link>
          <Link
            href="/restaurants"
            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-xs font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
          >
            <Store className="h-4 w-4" />
            <span>View Active Restaurants</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
