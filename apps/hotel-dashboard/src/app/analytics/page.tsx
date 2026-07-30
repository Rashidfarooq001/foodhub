'use client';

import React from 'react';
import { DollarSign, ShoppingBag, Star, Clock, TrendingUp, Users } from 'lucide-react';

const MOCK_HOTEL_ANALYTICS = {
  todaySales: 18450,
  todayOrders: 42,
  weeklySales: 124000,
  monthlySales: 485000,
  avgRating: 4.6,
  avgPrepTime: 18, // minutes
  repeatCustomerRate: 64, // %
  topSellingDishes: [
    { name: 'Special Chicken Biryani', orders: 420, revenue: 117600 },
    { name: 'Butter Chicken & Naan', orders: 310, revenue: 99200 },
    { name: 'Paneer Tikka Masala', orders: 240, revenue: 64800 },
    { name: 'Garlic Garlic Naan', orders: 580, revenue: 29000 },
  ],
};

export default function RestaurantAnalyticsPage() {
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Restaurant Analytics & Yield</h1>
        <p className="text-xs text-gray-500">Track dish performance, preparation speed, sales growth and ratings</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
            <span>Today's Sales</span>
            <div className="p-2 bg-emerald-50 rounded-2xl text-emerald-600"><DollarSign className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-black text-gray-900">₹{MOCK_HOTEL_ANALYTICS.todaySales.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{MOCK_HOTEL_ANALYTICS.todayOrders} completed orders</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
            <span>Monthly Revenue</span>
            <div className="p-2 bg-purple-50 rounded-2xl text-purple-600"><TrendingUp className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-black text-gray-900">₹{MOCK_HOTEL_ANALYTICS.monthlySales.toLocaleString()}</p>
          <p className="text-xs text-gray-400">₹{MOCK_HOTEL_ANALYTICS.weeklySales.toLocaleString()} this week</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
            <span>Average Rating</span>
            <div className="p-2 bg-amber-50 rounded-2xl text-amber-500"><Star className="h-4 w-4 fill-amber-400" /></div>
          </div>
          <p className="text-2xl font-black text-gray-900">{MOCK_HOTEL_ANALYTICS.avgRating} / 5.0</p>
          <p className="text-xs text-gray-400">Based on 340+ reviews</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
            <span>Avg Prep Time</span>
            <div className="p-2 bg-blue-50 rounded-2xl text-blue-600"><Clock className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-black text-gray-900">{MOCK_HOTEL_ANALYTICS.avgPrepTime} mins</p>
          <p className="text-xs text-gray-400">{MOCK_HOTEL_ANALYTICS.repeatCustomerRate}% repeat customers</p>
        </div>
      </div>

      {/* Top Dishes Table */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-base font-black text-gray-900">Top Performing Dishes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Dish Name</th>
                <th className="px-4 py-3">Orders Sold</th>
                <th className="px-4 py-3">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
              {MOCK_HOTEL_ANALYTICS.topSellingDishes.map((dish) => (
                <tr key={dish.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900">{dish.name}</td>
                  <td className="px-4 py-3">{dish.orders} units</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">₹{dish.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
