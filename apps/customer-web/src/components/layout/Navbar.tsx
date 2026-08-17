'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PartnerHeader } from './PartnerHeader';
import {
  Search,
  ShoppingBag,
  User,
  LogOut,
  Menu as MenuIcon,
  X,
  LogIn,
  UserPlus,
  Home,
  Clock,
  CreditCard,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';
import { useCartStore } from '../../stores/use-cart-store';
import { CartDrawer } from '../cart/CartDrawer';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const { user, isAuthenticated, logout } = useAuthStore();
  const { getItemCount } = useCartStore();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const itemCount = getItemCount();

  // Use partner header on partner routes
  if (pathname?.startsWith('/restaurant/register') || pathname?.startsWith('/driver/register')) {
    return <PartnerHeader />;
  }

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    setIsProfileOpen(false);
    router.push('/login');
  };

  // Initials avatar for logged-in user
  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 md:h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/zaykafood-logo.png" alt="ZaykaFood" className="h-9 w-auto object-contain" />
          </Link>

          {/* Desktop Search — hidden on mobile */}
          <div className="hidden flex-1 max-w-sm mx-6 md:block">
            <div
              onClick={() => router.push('/search')}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-400 hover:border-orange-300 hover:bg-white transition"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">Search restaurants or food</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex h-9 items-center gap-1.5 rounded-xl bg-orange-600 px-3 text-sm font-bold text-white hover:bg-orange-700 transition"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-orange-600">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Desktop: Sign In / Profile Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5 hover:bg-gray-50 transition"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.firstName || 'Profile'}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-black text-orange-700">
                      {initials}
                    </span>
                  )}
                  <span className="text-sm font-bold text-gray-800">{user.firstName}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl z-50">
                    <Link href="/" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">
                      <Home className="h-4 w-4" /> Home
                    </Link>
                    <Link href="/orders" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">
                      <Clock className="h-4 w-4" /> My Orders
                    </Link>
                    <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link href="/login" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:border-orange-500 hover:text-orange-600 transition">
                  Sign In
                </Link>
                <Link href="/signup" className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 transition">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-xl border border-gray-200 p-2 text-gray-600 md:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMenuOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden w-full">
            {isAuthenticated && user ? (
              <div className="space-y-1">
                {/* User info */}
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-2">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.firstName || 'Profile'} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-black text-orange-700">
                      {initials}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500">{user.phone}</p>
                  </div>
                </div>
                <Link href="/" onClick={closeMenu} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600">
                  <Home className="h-4 w-4 text-orange-500" /> Home
                </Link>
                <Link href="/orders" onClick={closeMenu} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600">
                  <Clock className="h-4 w-4 text-orange-500" /> My Orders
                </Link>
                <Link href="/profile" onClick={closeMenu} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600">
                  <User className="h-4 w-4 text-orange-500" /> Profile
                </Link>
                <div className="pt-1 border-t border-gray-100 mt-1">
                  <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login" onClick={closeMenu} className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-900 hover:bg-gray-50">
                  <LogIn className="h-4 w-4 text-orange-600" /> Sign In
                </Link>
                <Link href="/signup" onClick={closeMenu} className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-700">
                  <UserPlus className="h-4 w-4" /> Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
