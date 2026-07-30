'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bike,
  Navigation,
  History,
  DollarSign,
  Wallet,
  Star,
  FileCheck,
  Power,
  Bell,
  Settings,
  Sparkles,
} from 'lucide-react';

const NAVIGATION = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Available Orders', href: '/available-orders', icon: Bike },
  { name: 'Current Delivery', href: '/current-delivery', icon: Navigation },
  { name: 'Order History', href: '/orders', icon: History },
  { name: 'Earnings & Payouts', href: '/earnings', icon: DollarSign },
  { name: 'Driver Wallet', href: '/wallet', icon: Wallet },
  { name: 'Ratings & Feedback', href: '/ratings', icon: Star },
  { name: 'Vehicle & Documents', href: '/vehicle', icon: FileCheck },
  { name: 'Duty Availability', href: '/availability', icon: Power },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const DeliverySidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-100 bg-white flex flex-col justify-between hidden md:flex min-h-screen">
      <div className="p-6 space-y-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
            <Bike className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-black text-gray-900">
              Food<span className="text-emerald-600">Hub</span>
            </span>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Courier Partner
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {NAVIGATION.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Driver Footer Card */}
      <div className="p-4 border-t border-gray-100 bg-emerald-50/40 m-4 rounded-2xl">
        <p className="text-xs font-bold text-gray-900">Vikram Singh</p>
        <p className="text-[10px] text-emerald-700 font-bold">Vehicle: KA-01-HA-9821 (TVS NTORQ)</p>
      </div>
    </aside>
  );
};
