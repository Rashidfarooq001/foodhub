import React from 'react';
import CustomerHomePage from './client';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export const revalidate = 60; 

export default async function Page() {
  let initialRestaurants = [];
  let initialCategories = [];
  let initialBanners = [];

  try {
    const res = await fetch(`${API_BASE}/restaurants`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      initialRestaurants = Array.isArray(data) ? data : (data.restaurants ?? []);
    }
  } catch (e) {
    console.error('Failed to prefetch restaurants');
  }

  try {
    const resCat = await fetch(`${API_BASE}/categories`, { next: { revalidate: 3600 } });
    if (resCat.ok) {
      const data = await resCat.json();
      initialCategories = Array.isArray(data) ? data : (data.categories ?? []);
    }
  } catch (e) {
    console.error('Failed to prefetch categories');
  }

  try {
    const resBan = await fetch(`${API_BASE}/banners`, { next: { revalidate: 60 } });
    if (resBan.ok) {
      const data = await resBan.json();
      initialBanners = Array.isArray(data) ? data : (data.banners ?? []);
    }
  } catch (e) {
    console.error('Failed to prefetch banners');
  }

  return <CustomerHomePage 
    initialRestaurants={initialRestaurants} 
    initialCategories={initialCategories} 
    initialBanners={initialBanners} 
  />;
}
