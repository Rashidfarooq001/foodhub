'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight, Tag, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getApiBaseUrl } from '@foodhub/config';
import { io } from 'socket.io-client';

const API_BASE = getApiBaseUrl();
const SOCKET_URL = API_BASE.replace('/api/v1', '');

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl?: string;
}

interface Props {
  initialBanners?: Banner[];
}

export const HeroBanner: React.FC<Props> = ({ initialBanners = [] }) => {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [current, setCurrent] = useState(0);

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_BASE}/banners`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.banners ?? []);
        setBanners(list);
      }
    } catch {
      // offline
    }
  };

  useEffect(() => {
    if (initialBanners.length === 0) {
      fetchBanners();
    }

    // Setup Socket.IO for realtime banner sync
    const socket = io(SOCKET_URL);
    socket.on('banner:updated', () => {
      fetchBanners();
    });

    return () => {
      socket.disconnect();
    };
  }, [initialBanners]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  // If no active banners exist in backend, render clean platform welcome card
  if (banners.length === 0) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 p-5 sm:p-7 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5 text-rose-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> Zayka Food Delivery
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              Delicious Food Delivered Fast Across Kashmir
            </h2>
            <p className="text-xs sm:text-sm text-rose-100">
              Order fresh meals, biryani, wazwan and more from verified local kitchens.
            </p>
          </div>
          <Link
            href="/restaurants"
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 transition shrink-0 shadow-sm"
          >
            Explore Restaurants <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const activeBanner = banners[current] || banners[0];

  return (
    <div className="relative w-full h-[200px] sm:h-[280px] overflow-hidden rounded-2xl shadow-sm transition-all duration-500 group">
      <Image
        src={activeBanner.imageUrl}
        alt={activeBanner.title}
        fill
        priority
        sizes="(max-width: 640px) 100vw, 1280px"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
      
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7 pointer-events-none">
        <div className="space-y-2 min-w-0 pointer-events-auto w-full sm:w-2/3">
          <div className="flex items-center gap-1.5 text-white/90 text-xs font-bold uppercase tracking-wider">
            <Tag className="h-3.5 w-3.5" /> Featured
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
            {activeBanner.title}
          </h2>
          {activeBanner.targetUrl && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={activeBanner.targetUrl}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-gray-900 hover:bg-gray-50 transition shadow-sm"
              >
                Learn More <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-5 right-5 flex gap-1.5 z-10 pointer-events-auto">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
