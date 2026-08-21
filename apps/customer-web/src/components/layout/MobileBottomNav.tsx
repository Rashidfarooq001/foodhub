'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ClipboardList, Tag, User } from 'lucide-react';
import { useCartStore } from '../../stores/use-cart-store';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { getItemCount } = useCartStore();
  const cartCount = getItemCount();

  // Hide on partner registration routes or checkout
  if (
    pathname?.startsWith('/restaurant/register') ||
    pathname?.startsWith('/driver/register') ||
    pathname?.startsWith('/checkout')
  ) {
    return null;
  }

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Orders', href: '/orders', icon: ClipboardList },
    { label: 'Offers', href: '/coupons', icon: Tag },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 block border-t border-gray-100 bg-white/95 backdrop-blur-md px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive ? 'text-rose-600 scale-105' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.label === 'Orders' && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-black' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
