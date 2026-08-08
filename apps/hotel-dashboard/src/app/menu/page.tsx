'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Upload, Edit, Trash2, CheckCircle2, X, Copy, Tag, FolderPlus, MoveUp, MoveDown } from 'lucide-react';
import { MediaUploader } from '../../components/common/MediaUploader';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { getApiBaseUrl, getImageUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();


interface FoodItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl?: string;
  categoryId: string;
  category?: { id: string; name: string };
  variants?: any[];
  addonGroups?: any[];
}

interface Category {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export default function HotelMenuPage() {
 const { user, accessToken } = useHotelAuthStore();

if (!user?.restaurantId) {
  return <div>Restaurant not found. Please login again.</div>;
}

const restaurantId = user.restaurantId;

  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  // Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number>(250);
  const [isVeg, setIsVeg] = useState(true);
  const [image, setImage] = useState('');
  const [error, setError] = useState('');

  const fetchMenuAndCategories = async () => {
    try {
      const [catRes, menuRes] = await Promise.all([
        fetch(`${API_BASE}/menus/categories/restaurant/${restaurantId}`),
        fetch(`${API_BASE}/menus/restaurant/${restaurantId}`),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : []);
        if (catData.length > 0 && !categoryId) {
          setCategoryId(catData[0].id);
        }
      }

      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setItems(Array.isArray(menuData) ? menuData : []);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuAndCategories();
  }, [restaurantId]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/menus/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          restaurantId,
          name: newCategoryName.trim(),
          displayOrder: categories.length,
        }),
      });

      if (res.ok) {
        setNewCategoryName('');
        setIsCategoryModalOpen(false);
        fetchMenuAndCategories();
      }
    } catch {
      setError('Failed to create category');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`${API_BASE}/menus/categories/${catId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) fetchMenuAndCategories();
    } catch {
      /* ignore */
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/menus/items/${id}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, isAvailable: !currentStatus } : i)),
        );
      }
    } catch {
      /* ignore */
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this food item?')) return;
    try {
      const res = await fetch(`${API_BASE}/menus/items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch {
      /* ignore */
    }
  };

  const duplicateItem = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/menus/items/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) fetchMenuAndCategories();
    } catch {
      /* ignore */
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) {
      setError('Please provide item name and category');
      return;
    }

    const payload = {
      restaurantId,
      categoryId,
      name,
      description,
      price: Number(price),
      isVeg,
      imageUrl: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
    };

    try {
      const url = editingItem
        ? `${API_BASE}/menus/items/${editingItem.id}`
        : `${API_BASE}/menus/items`;
      const method = editingItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setName('');
        setDescription('');
        setImage('');
        setEditingItem(null);
        fetchMenuAndCategories();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Failed to save menu item');
      }
    } catch {
      setError('Network error saving menu item');
    }
  };

  const openEdit = (item: FoodItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setCategoryId(item.categoryId);
    setPrice(Number(item.price));
    setIsVeg(item.isVeg);
    setImage(item.imageUrl || '');
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Menu Catalog ({items.length})</h1>
          <p className="text-xs text-gray-500">Manage dish items, categories, variants, and live stock availability</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <FolderPlus className="h-4 w-4 text-orange-600" /> Manage Categories ({categories.length})
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setName('');
              setDescription('');
              setPrice(250);
              if (categories.length > 0 && !categoryId) {
                setCategoryId(categories[0].id);
              }
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" /> Add Food Item
          </button>
        </div>
      </div>

      {/* Menu Item Cards */}
      {items.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
          <Tag className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="font-bold text-gray-700">No food items added yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Food Item" above to publish your first dish.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm space-y-4 p-5">
              <div className="relative h-40 w-full overflow-hidden rounded-2xl">
                <img
                  src={getImageUrl(item.imageUrl)}
                  alt={item.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                  }}
                  className="h-full w-full object-cover"
                />
                <span

                  className={`absolute top-3 left-3 flex h-4 w-4 items-center justify-center rounded-sm border ${
                    item.isVeg ? 'border-emerald-600 bg-white' : 'border-rose-600 bg-white'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {item.category?.name || 'Main Course'}
                </span>
                <h3 className="text-base font-bold text-gray-900">{item.name}</h3>
                {item.description && <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>}
                <p className="text-lg font-black text-orange-600 mt-1">₹{item.price}</p>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">In Stock:</span>
                  <button
                    onClick={() => toggleAvailability(item.id, item.isAvailable)}
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

                <div className="flex gap-1.5">
                  <button
                    onClick={() => duplicateItem(item.id)}
                    title="Duplicate Item"
                    className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    title="Edit Item"
                    className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    title="Delete Item"
                    className="rounded-xl border border-gray-200 p-2 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">Manage Menu Categories</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="flex gap-2">
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New Category (e.g. Starters)"
                className="flex-1 rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold focus:border-orange-500 focus:outline-none"
              />
              <button type="submit" className="rounded-2xl bg-orange-600 px-4 py-2.5 text-xs font-black text-white hover:bg-orange-700">
                Add
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                  <span className="text-xs font-bold text-gray-800">{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Food Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">
                {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 border border-rose-100">
                ⚠️ {error}
              </div>
            )}

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

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rich cottage cheese in tomato gravy..."
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  {categories.length > 0 ? (
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-rose-600 font-bold">Please add a category first</div>
                  )}
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
    </div>
  );
}
