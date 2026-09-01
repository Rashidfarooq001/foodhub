'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Store,
  CheckSquare,
  Bike,
  ShoppingBag,
  CreditCard,
  BarChart3,
  Shield,
  ShieldCheck,
  Settings,
  UserCog,
  DollarSign,
  X,
} from 'lucide-react';

const NAVIGATION = [
  { name: 'Platform Overview', href: '/', icon: LayoutDashboard },
  { name: 'Restaurant Approval Queue', href: '/restaurants/approval', icon: CheckSquare },
  { name: 'All Restaurants', href: '/restaurants', icon: Store },
  { name: 'Driver Approval Queue', href: '/delivery-partners/approval', icon: CheckSquare },
  { name: 'Delivery Partners', href: '/delivery-partners', icon: Bike },
  { name: 'Customer Directory', href: '/customers', icon: Users },
  { name: 'Global Orders Log', href: '/orders', icon: ShoppingBag },
  { name: 'Payments & Settlements', href: '/payments', icon: CreditCard },
  { name: 'Analytics & Reports', href: '/analytics', icon: BarChart3 },

  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Audit Logs & Security', href: '/audit-logs', icon: Shield },
  { name: 'Account Settings', href: '/account-settings', icon: UserCog },
];

interface AdminSidebarProps {
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isMobileMenuOpen = false,
  onCloseMobileMenu = () => {},
}) => {
  const pathname = usePathname();

  useEffect(() => {
    onCloseMobileMenu();
  }, [pathname]);

  const SidebarContent = (
    <div className="flex flex-col h-full justify-between gap-4">
      <div className="space-y-4">
        {/* Brand & Mobile Close */}
        <div className="flex items-center justify-between px-1">
          <Link href="/" onClick={onCloseMobileMenu} className="flex items-center gap-2">
            <img src="/zaykafood-logo.png" alt="ZaykaFood" className="h-8 w-auto object-contain" />
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                SuperAdmin
              </span>
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
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-190px)] pr-1 scrollbar-thin">
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
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
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

      {/* Admin Footer Badge */}
      <div className="p-3.5 border-t border-gray-100 bg-purple-50/50 rounded-2xl shrink-0">
        <p className="text-xs font-bold text-purple-900 truncate">SuperAdmin Operator</p>
        <p className="text-[10px] text-purple-700 font-bold truncate">
          Role: Platform Owner (Full Access)
        </p>
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
