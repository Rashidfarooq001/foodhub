'use client';

import React from 'react';
import { Users, Heart } from 'lucide-react';

export default function HotelCustomersPage() {
  const customers = [
    {
      id: 'c1',
      name: 'Rahul Sharma',
      phone: '+919876543210',
      totalOrders: 14,
      totalSpent: 4850,
      favorite: 'Paneer Butter Masala',
    },
    {
      id: 'c2',
      name: 'Priya Patel',
      phone: '+919876543211',
      totalOrders: 8,
      totalSpent: 2720,
      favorite: 'Hyderabadi Biryani',
    },
    {
      id: 'c3',
      name: 'Anish Verma',
      phone: '+919876543212',
      totalOrders: 5,
      totalSpent: 1980,
      favorite: 'Garlic Naan',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">
          Customer Directory ({customers.length})
        </h1>
        <p className="text-xs text-gray-500">
          Repeat customers, lifetime spending & favorite dishes
        </p>
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Total Orders</th>
              <th className="px-6 py-4">Lifetime Spent</th>
              <th className="px-6 py-4">Favorite Dish</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">{c.name}</p>
                  <p className="text-[10px] text-gray-400">{c.phone}</p>
                </td>
                <td className="px-6 py-4 font-black text-gray-900">{c.totalOrders} Orders</td>
                <td className="px-6 py-4 font-black text-emerald-600">₹{c.totalSpent}</td>
                <td className="px-6 py-4 text-gray-600">{c.favorite}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
