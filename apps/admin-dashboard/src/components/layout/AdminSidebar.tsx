'use client';

import React from 'react';
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
  Tag,
  BarChart3,
  HelpCircle,
  FileCode,
  Shield,
  Sliders,
  Settings,
  Sparkles,
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
  { name: 'Coupons & Campaigns', href: '/coupons', icon: Tag },
  { name: 'Analytics & Reports', href: '/analytics', icon: BarChart3 },
  { name: 'Support Tickets', href: '/support-tickets', icon: HelpCircle },
  { name: 'CMS & Banners', href: '/cms', icon: FileCode },
  { name: 'Feature Flags & Maintenance', href: '/feature-flags', icon: Sliders },
  { name: 'System Settings', href: '/system-settings', icon: Settings },
  { name: 'Audit Logs & Security', href: '/audit-logs', icon: Shield },
];

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-100 bg-white flex flex-col justify-between hidden md:flex min-h-screen">
      <div className="p-6 space-y-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-black text-gray-900">
              Food<span className="text-purple-600">Hub</span>
            </span>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              SuperAdmin Control
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
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
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

      {/* Admin Footer Badge */}
      <div className="p-4 border-t border-gray-100 bg-purple-50/50 m-4 rounded-2xl">
        <p className="text-xs font-bold text-purple-900">SuperAdmin Operator</p>
        <p className="text-[10px] text-purple-700">Role: Platform Owner (Full Access)</p>
      </div>
    </aside>
  );
};
