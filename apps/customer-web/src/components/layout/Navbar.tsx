'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PartnerHeader } from './PartnerHeader';
import {
  MapPin,
  Search,
  ShoppingBag,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Heart,
  Wallet,
  Clock,
  Menu as MenuIcon,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';
import { useCartStore } from '../../stores/use-cart-store';
import { useAddressStore } from '../../stores/use-address-store';
import { useSettingsStore } from '../../stores/use-settings-store';
import { CartDrawer } from '../cart/CartDrawer';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const { user, isAuthenticated, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { getSelectedAddress } = useAddressStore();
  const { isVegOnly, toggleVegOnly } = useSettingsStore();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeAddress = getSelectedAddress();
  const itemCount = getItemCount();

  if (pathname?.startsWith('/restaurant/register') || pathname?.startsWith('/driver/register')) {
    return <PartnerHeader />;
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand Logo & Address Selector */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="text-2xl font-black tracking-tight text-gray-900">
                Food<span className="text-orange-600">Hub</span>
              </span>
            </Link>

            {/* Address Selector Trigger */}
            <button
              onClick={() => router.push('/addresses')}
              className="hidden items-center gap-2 rounded-xl bg-gray-50 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:flex"
            >
              <MapPin className="h-4 w-4 text-orange-600" />
              <div className="max-w-[180px] text-left">
                <span className="block text-xs font-bold text-gray-900">
                  {activeAddress?.label || 'Select Location'}
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {activeAddress ? `${activeAddress.addressLine1}, ${activeAddress.city}` : 'Add delivery address'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Center: Search Trigger */}
          <div className="hidden flex-1 max-w-md px-6 md:block">
            <div
              onClick={() => router.push('/search')}
              className="relative flex cursor-pointer items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-400 transition hover:border-orange-300 hover:bg-white hover:shadow-md"
            >
              <Search className="mr-3 h-4 w-4 text-gray-400" />
              <span>Search for biryani, pizza, burgers...</span>
            </div>
          </div>

          {/* Right Actions: Veg Toggle, Cart, Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Veg Only Toggle */}
            <button
              onClick={toggleVegOnly}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                isVegOnly
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <span
                className={`flex h-3 w-3 items-center justify-center rounded-sm border ${
                  isVegOnly ? 'border-emerald-600 bg-emerald-600' : 'border-emerald-600'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              </span>
              <span>VEG ONLY</span>
            </button>

            {/* Cart Button Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex h-11 items-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-orange-600">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Profile / Auth Menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 rounded-2xl border border-gray-200 p-1.5 hover:bg-gray-50"
                >
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                    alt={user.firstName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="hidden text-sm font-bold text-gray-800 lg:inline">
                    {user.firstName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl">
                    <div className="border-b border-gray-100 p-3">
                      <p className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">{user.phone}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                      >
                        <User className="h-4 w-4" /> Profile & Settings
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                      >
                        <Clock className="h-4 w-4" /> Order History
                      </Link>
                      <Link
                        href="/wallet"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                      >
                        <Wallet className="h-4 w-4" /> FoodHub Wallet
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                      >
                        <Heart className="h-4 w-4" /> Wishlist
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800"
              >
                <User className="h-4 w-4" /> Login
              </Link>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-xl border border-gray-200 p-2 text-gray-600 md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
