'use client';

import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle2, ShieldAlert, Loader2, Power } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';

interface StockItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
}

export default function HotelInventoryPage() {
  const { user, accessToken } = useHotelAuthStore();
  const restaurantId = user?.restaurantId;

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!restaurantId) {
      setIsLoading(false);
      return;
    }

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/menus/restaurant/${restaurantId}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        const items: StockItem[] = [];

        if (Array.isArray(data)) {
          data.forEach((cat: any) => {
            const catName = cat.name || 'General';
            if (Array.isArray(cat.foodItems)) {
              cat.foodItems.forEach((item: any) => {
                items.push({
                  id: item.id,
                  name: item.name,
                  category: catName,
                  price: Number(item.price || 0),
                  isAvailable: item.isAvailable ?? true,
                });
              });
            } else if (cat.id && cat.name && !cat.foodItems && cat.price !== undefined) {
              items.push({
                id: cat.id,
                name: cat.name,
                category: 'General',
                price: Number(cat.price || 0),
                isAvailable: cat.isAvailable ?? true,
              });
            }
          });
        }

        setStockItems(items);
      }
    } catch (err) {
      console.error('Failed to load inventory items', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [restaurantId, accessToken]);

  const toggleStock = async (item: StockItem) => {
    if (togglingId) return;
    setTogglingId(item.id);
    const newStatus = !item.isAvailable;

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/menus/items/${item.id}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ isAvailable: newStatus }),
      });

      if (res.ok) {
        setStockItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isAvailable: newStatus } : i)),
        );
      }
    } catch (err) {
      console.error('Failed to update item availability', err);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Inventory & Stock Control</h1>
          <p className="text-xs text-gray-500">
            Track real-time stock levels, live kitchen availability & auto-disabled dishes
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center">
          <p className="text-sm font-bold text-gray-400">Loading catalog inventory...</p>
        </div>
      ) : stockItems.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center space-y-3">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <p className="text-base font-bold text-gray-700">No menu items found</p>
          <p className="text-xs text-gray-400">
            Add dishes in the Menu Catalog to manage their stock and kitchen availability.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Kitchen Status</th>
                <th className="px-6 py-4">Quick Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {stockItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-gray-500">{item.category}</td>
                  <td className="px-6 py-4 font-black text-gray-900">₹{item.price}</td>
                  <td className="px-6 py-4">
                    {item.isAvailable ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="h-3 w-3" /> AVAILABLE
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black text-rose-800 flex items-center gap-1 w-fit">
                        <ShieldAlert className="h-3 w-3" /> SOLD OUT
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStock(item)}
                      disabled={togglingId === item.id}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                        item.isAvailable
                          ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="h-3 w-3" />
                      {togglingId === item.id
                        ? 'Updating...'
                        : item.isAvailable
                          ? 'Mark Sold Out'
                          : 'Mark Available'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
