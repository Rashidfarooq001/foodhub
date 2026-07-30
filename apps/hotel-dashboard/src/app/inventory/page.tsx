'use client';

import React, { useState } from 'react';
import { Package, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function HotelInventoryPage() {
  const [stockItems, setStockItems] = useState([
    { id: 'i1', name: 'Paneer Butter Masala', category: 'Main Course', stock: 45, status: 'IN_STOCK' },
    { id: 'i2', name: 'Hyderabadi Chicken Biryani', category: 'Biryani', stock: 8, status: 'LOW_STOCK' },
    { id: 'i3', name: 'Gulab Jamun (2 Pcs)', category: 'Desserts', stock: 0, status: 'OUT_OF_STOCK' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Inventory & Stock Control</h1>
          <p className="text-xs text-gray-500">Track real-time stock levels, low-stock alerts & auto-disabled dishes</p>
        </div>
      </div>

      {/* Stock Table */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Item Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Stock Count</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
            {stockItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-gray-500">{item.category}</td>
                <td className="px-6 py-4 font-black text-gray-900">{item.stock} units</td>
                <td className="px-6 py-4">
                  {item.status === 'IN_STOCK' && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800">
                      IN STOCK
                    </span>
                  )}
                  {item.status === 'LOW_STOCK' && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black text-amber-800 flex items-center gap-1 w-fit">
                      <AlertTriangle className="h-3 w-3" /> LOW STOCK
                    </span>
                  )}
                  {item.status === 'OUT_OF_STOCK' && (
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black text-rose-800 flex items-center gap-1 w-fit">
                      <ShieldAlert className="h-3 w-3" /> OUT OF STOCK
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => {
                      const qty = prompt(`Update stock count for ${item.name}:`, item.stock.toString());
                      if (qty !== null) {
                        const num = parseInt(qty, 10);
                        setStockItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id
                              ? {
                                  ...i,
                                  stock: num,
                                  status: num === 0 ? 'OUT_OF_STOCK' : num < 10 ? 'LOW_STOCK' : 'IN_STOCK',
                                }
                              : i,
                          ),
                        );
                      }
                    }}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Restock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
