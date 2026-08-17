'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  LogOut,
  X,
} from 'lucide-react';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';

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
  const router = useRouter();
  const { user, logout } = useDeliveryAuthStore();

  useEffect(() => {
    onCloseMobileMenu();
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const SidebarContent = (
    <div className="flex flex-col h-full justify-between gap-4">
      <div className="space-y-4">
        {/* Brand & Mobile Close */}
        <div className="flex items-center justify-between px-1">
          <Link href="/" onClick={onCloseMobileMenu} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
              <Bike className="h-4 w-4" />
            </div>
            <div>
              <img src="/zaykafood-logo.png" alt="ZaykaFood" className="h-7 w-auto object-contain" />
            </div>
          </Link>

          <button
            onClick={onCloseMobileMenu}
            className="lg:hidden rounded-2xl p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close Navigation"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-210px)] pr-1 scrollbar-thin">
          {NAVIGATION.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobileMenu}
                className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold transition min-h-[44px] ${
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

          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 transition min-h-[44px]"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Driver Footer Card */}
      <div className="p-3.5 border-t border-gray-100 bg-emerald-50/40 rounded-2xl shrink-0">
        <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Courier Partner'}</p>
        <p className="text-[10px] text-emerald-700 font-bold truncate">KA-01-HA-9821 (Active Driver)</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Permanent Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-gray-100 bg-white min-h-screen shrink-0 p-5 flex-col justify-between sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer Overlay & Panel */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobileMenu}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white p-5 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col justify-between pb-safe">
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
