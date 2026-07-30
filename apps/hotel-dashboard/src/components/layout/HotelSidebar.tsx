'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  MenuSquare,
  Package,
  Tag,
  Users,
  Star,
  BarChart3,
  UserCheck,
  Clock,
  Settings,
  Sparkles,
} from 'lucide-react';

const NAVIGATION = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Kitchen KDS Queue', href: '/kitchen-queue', icon: UtensilsCrossed },
  { name: 'All Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Menu Catalog', href: '/menu', icon: MenuSquare },
  { name: 'Inventory Stock', href: '/inventory', icon: Package },
  { name: 'Offers & Coupons', href: '/offers', icon: Tag },
  { name: 'Customer Directory', href: '/customers', icon: Users },
  { name: 'Reviews & Ratings', href: '/reviews', icon: Star },
  { name: 'Reports & Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Staff Management', href: '/staff', icon: UserCheck },
  { name: 'Business Hours', href: '/business-hours', icon: Clock },
  { name: 'Restaurant Settings', href: '/settings', icon: Settings },
];

export const HotelSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-100 bg-white flex flex-col justify-between hidden md:flex min-h-screen">
      <div className="p-6 space-y-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-black text-gray-900">
              Food<span className="text-orange-600">Hub</span>
            </span>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Merchant KDS
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
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
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

      {/* Footer Store Info */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 m-4 rounded-2xl">
        <p className="text-xs font-bold text-gray-900">Spice Garden Restaurant</p>
        <p className="text-[10px] text-gray-500">Store ID: #REST-94810</p>
      </div>
    </aside>
  );
};
