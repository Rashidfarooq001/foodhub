'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  MenuSquare,
  BarChart3,
  Clock,
  Settings,
  Sparkles,
  LogOut,
  X,
} from 'lucide-react';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';

interface NavGroup {
  groupName: string;
  items: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupName: 'MAIN',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    groupName: 'ORDERS',
    items: [
      { name: 'Kitchen KDS', href: '/kitchen-queue', icon: UtensilsCrossed },
      { name: 'All Orders', href: '/orders', icon: ShoppingBag },
      { name: 'Delivery Tracking', href: '/delivery-management', icon: Bike },
    ],
  },
  {
    groupName: 'CATALOG',
    items: [
      { name: 'Menu Catalog', href: '/menu', icon: MenuSquare },
    ],
  },
  {
    groupName: 'BUSINESS',
    items: [
      { name: 'Reports & Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Weekly Settlements', href: '/settlements', icon: Sparkles },
      { name: 'Business Hours', href: '/business-hours', icon: Clock },
      { name: 'Restaurant Settings', href: '/settings', icon: Settings },
    ],
  },
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
  const router = useRouter();
  const { user, logout } = useHotelAuthStore();

  const restaurantName = user?.restaurantName || (user as any)?.name || 'Merchant Kitchen';
  const restaurantId = user?.restaurantId || 'Active';

  // Close mobile drawer on route change
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
        {/* Brand & Mobile Close Button */}
        <div className="flex items-center justify-between px-1">
          <Link href="/" onClick={onCloseMobileMenu} className="flex flex-col gap-1">
            <img src="/zaykafood-logo.png" alt="ZaykaFood" className="h-8 w-auto object-contain" />
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Merchant Operations
            </span>
          </Link>

          {/* Close button for Mobile Drawer */}
          <button
            onClick={onCloseMobileMenu}
            className="lg:hidden rounded-2xl p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close Navigation"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-3.5 overflow-y-auto max-h-[calc(100vh-210px)] pr-1 scrollbar-thin">
          {NAV_GROUPS.map((group) => (
            <div key={group.groupName} className="space-y-1">
              <span className="px-3.5 text-[10px] font-black uppercase tracking-wider text-gray-400">
                {group.groupName}
              </span>
              <div className="space-y-0.5 pt-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onCloseMobileMenu}
                      className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition min-h-[44px] ${
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
              </div>
            </div>
          ))}

          {/* ACCOUNT GROUP */}
          <div className="space-y-1 pt-2 border-t border-gray-100">
            <span className="px-3.5 text-[10px] font-black uppercase tracking-wider text-gray-400">
              ACCOUNT
            </span>
            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition min-h-[44px]"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Footer Store Info */}
      <div className="p-3.5 border border-gray-100 bg-gray-50/80 rounded-2xl shrink-0">
        <p className="text-xs font-bold text-gray-900 truncate">{restaurantName}</p>
        <p className="text-[10px] text-gray-500 truncate">ID: {restaurantId.slice(0, 16)}...</p>
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
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobileMenu}
          />

          {/* Slide-out Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white p-5 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col justify-between pb-safe">
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
