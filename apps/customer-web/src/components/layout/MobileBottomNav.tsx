'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, ShoppingBag, User, Search } from 'lucide-react';
import { useCartStore } from '../../stores/use-cart-store';
import { CartDrawer } from '../cart/CartDrawer';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { getItemCount } = useCartStore();
  const cartCount = getItemCount();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Hide on partner registration routes, checkout, and auth pages
  if (
    pathname?.startsWith('/restaurant/register') ||
    pathname?.startsWith('/driver/register') ||
    pathname?.startsWith('/checkout') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/signup') ||
    pathname?.startsWith('/forgot-password')
  ) {
    return null;
  }

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Orders', href: '/orders', icon: ClipboardList },
    { label: 'Cart', isCartAction: true, icon: ShoppingBag },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <>
      {/* Fixed Mobile Bottom Navigation (Non Slide) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 block border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 py-2 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] md:hidden"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href ? (item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)) : false;

            if (item.isCartAction) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-gray-500 hover:text-rose-600 transition-all focus:outline-none"
                >
                  <div className="relative">
                    <Icon className="h-5 w-5 stroke-2" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white shadow-sm">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold tracking-tight mt-0.5">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href!}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                  isActive ? 'text-rose-600 scale-105' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className={`text-[11px] tracking-tight mt-0.5 ${isActive ? 'font-black' : 'font-bold'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Cart Drawer for Bottom Nav Trigger */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
