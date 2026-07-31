'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
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
  X,
} from 'lucide-react';

const NAVIGATION = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Kitchen KDS Queue', href: '/kitchen-queue', icon: UtensilsCrossed },
  { name: 'All Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Delivery Management', href: '/delivery-management', icon: Bike },
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

interface HotelSidebarProps {
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const HotelSidebar: React.FC<HotelSidebarProps> = ({
  isMobileMenuOpen = false,
  onCloseMobileMenu = () => {},
}) => {
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    onCloseMobileMenu();
  }, [pathname]);

  const SidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        {/* Brand & Mobile Close Button */}
        <div className="flex items-center justify-between">
          <Link href="/" onClick={onCloseMobileMenu} className="flex items-center gap-2">
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

          {/* Close button for Mobile Drawer */}
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
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
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

      {/* Footer Store Info */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-2xl">
        <p className="text-xs font-bold text-gray-900 truncate">Spice Garden Restaurant</p>
        <p className="text-[10px] text-gray-500">Store ID: #REST-94810</p>
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
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobileMenu}
          />

          {/* Slide-out Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col justify-between">
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
