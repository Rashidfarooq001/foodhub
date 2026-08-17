'use client';

import React, { useEffect } from 'react';
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
  X,
} from 'lucide-react';

const NAVIGATION = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Available Orders', href: '/available-orders', icon: Bike },
  { name: 'Current Delivery', href: '/current-delivery', icon: Navigation },
  { name: 'Order History', href: '/orders', icon: History },
  { name: 'Earnings Trend', href: '/earnings', icon: DollarSign },
  { name: 'Settlement Ledger', href: '/wallet', icon: Wallet },
  { name: 'Ratings & Feedback', href: '/ratings', icon: Star },
  { name: 'Vehicle & Documents', href: '/vehicle', icon: FileCheck },
  { name: 'Duty Availability', href: '/availability', icon: Power },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface DeliverySidebarProps {
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const DeliverySidebar: React.FC<DeliverySidebarProps> = ({
  isMobileMenuOpen = false,
  onCloseMobileMenu = () => {},
}) => {
  const pathname = usePathname();

  useEffect(() => {
    onCloseMobileMenu();
  }, [pathname]);

  const SidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        {/* Brand & Mobile Close */}
        <div className="flex items-center justify-between">
          <Link href="/" onClick={onCloseMobileMenu} className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
              <Bike className="h-5 w-5" />
            </div>
            <div>
              <img src="/zaykafood-logo.png" alt="ZaykaFood" className="h-8 w-auto object-contain dark:invert" />
            </div>
          </Link>

          <button
            onClick={onCloseMobileMenu}
            className="lg:hidden rounded-2xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close Navigation"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)] pr-1 scrollbar-thin">
          {NAVIGATION.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobileMenu}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition min-h-[44px] ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Driver Footer Card */}
      <div className="p-4 border-t border-gray-100 bg-emerald-50/40 rounded-2xl">
        <p className="text-xs font-bold text-gray-900 truncate">Vikram Singh</p>
        <p className="text-[10px] text-emerald-700 font-bold truncate">KA-01-HA-9821 (TVS NTORQ)</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Permanent Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-gray-100 bg-white min-h-screen shrink-0 p-6 flex-col justify-between sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer Overlay & Panel */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobileMenu}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col justify-between">
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
