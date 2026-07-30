'use client';

import React, { useState } from 'react';
import { Plus, Upload, Edit, Trash2, CheckCircle2, X } from 'lucide-react';
import { MediaUploader } from '../../components/common/MediaUploader';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  image?: string;
}

export default function HotelMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([
    {
      id: 'm1',
      name: 'Paneer Butter Masala',
      category: 'Main Course',
      price: 280,
      isVeg: true,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'm2',
      name: 'Garlic Naan (2 Pcs)',
      category: 'Breads',
      price: 90,
      isVeg: true,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'm3',
      name: 'Hyderabadi Chicken Dum Biryani',
      category: 'Biryani',
      price: 340,
      isVeg: false,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80',
    },
  ]);

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Main Course');
  const [price, setPrice] = useState(250);
  const [isVeg, setIsVeg] = useState(true);
  const [image, setImage] = useState('');

  const toggleAvailability = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isAvailable: !i.isAvailable } : i)),
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id ? { ...i, name, category, price: Number(price), isVeg, image: image || i.image } : i,
        ),
      );
      setEditingItem(null);
    } else {
      const newItem: MenuItem = {
        id: `m_${Date.now()}`,
        name,
        category,
        price: Number(price),
        isVeg,
        isAvailable: true,
        image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
      };
      setItems((prev) => [newItem, ...prev]);
    }

    setIsAddModalOpen(false);
    setName('');
    setImage('');
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setIsVeg(item.isVeg);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Menu Catalog ({items.length})</h1>
          <p className="text-xs text-gray-500">Manage dish items, prices, variants, and stock availability</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" /> Bulk CSV Import
          </button>
          <button
            onClick={() => {
              setEditingItem(null);
              setName('');
              setPrice(250);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" /> Add Food Item
          </button>
        </div>
      </div>

      {/* Menu Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm space-y-4 p-5">
            <div className="relative h-40 w-full overflow-hidden rounded-2xl">
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              <span
                className={`absolute top-3 left-3 flex h-4 w-4 items-center justify-center rounded-sm border ${
                  item.isVeg ? 'border-emerald-600 bg-white' : 'border-rose-600 bg-white'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.category}</span>
              <h3 className="text-base font-bold text-gray-900">{item.name}</h3>
              <p className="text-lg font-black text-orange-600 mt-1">₹{item.price}</p>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">In Stock:</span>
                <button
                  onClick={() => toggleAvailability(item.id)}
                  className={`h-5 w-9 rounded-full p-0.5 transition ${
                    item.isAvailable ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transition ${
                      item.isAvailable ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(item)}
                  className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="rounded-xl border border-gray-200 p-2 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">
                {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Paneer Butter Masala"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Starters">Starters</option>
                    <option value="Biryani">Biryani</option>
                    <option value="Breads">Breads</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <MediaUploader
                label="Food Dish Photo (JPG, PNG, WEBP max 5MB)"
                acceptType="image"
                value={image}
                onChange={setImage}
              />

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isVeg"
                  checked={isVeg}
                  onChange={(e) => setIsVeg(e.target.checked)}
                  className="h-4 w-4 rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="isVeg" className="text-xs font-bold text-gray-700">
                  Pure Vegetarian Item
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-2xl bg-gray-100 px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-orange-700"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">Bulk Import Menu Items (CSV)</h3>
              <button onClick={() => setIsCsvModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center space-y-3 bg-gray-50/50">
              <Upload className="mx-auto h-8 w-8 text-orange-600" />
              <p className="text-xs font-bold text-gray-800">Select or drop menu.csv file</p>
              <p className="text-[10px] text-gray-400">Supported format: CSV (Max 10MB)</p>
            </div>

            <button
              onClick={() => setIsCsvModalOpen(false)}
              className="w-full rounded-2xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-orange-700"
            >
              Upload & Process Catalog
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
