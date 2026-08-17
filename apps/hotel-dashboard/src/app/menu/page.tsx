'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle2, X, Copy, Tag, FolderPlus, Layers, ToggleLeft, ToggleRight } from 'lucide-react';
import { MediaUploader } from '../../components/common/MediaUploader';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { getApiBaseUrl, getImageUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

interface FoodVariant {
  id?: string;
  variantName: string;
  price: number;
  isAvailable?: boolean;
  displayOrder?: number;
}

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
  variants?: FoodVariant[];
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
    return (
      <div className="p-8 text-center text-xs font-bold text-gray-500">
        Restaurant not found. Please login again.
      </div>
    );
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
  const [variants, setVariants] = useState<FoodVariant[]>([]);
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

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsCreatingCategory(true);
    setCategoryError(null);

    try {
      const res = await fetch(`${API_BASE}/menus/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          restaurantId,
          name: newCategoryName.trim(),
          displayOrder: categories.length,
        }),
      });

      if (res.ok) {
        setNewCategoryName('');
        setCategoryError(null);
        setIsCategoryModalOpen(false);
        await fetchMenuAndCategories();
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || 'Failed to create category on server.';
        setCategoryError(errMsg);
      }
    } catch (err: any) {
      setCategoryError(err.message || 'Network connection failed while creating category.');
    } finally {
      setIsCreatingCategory(false);
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

  const toggleVariantAvailability = async (variantId: string, currentStatus: boolean, itemId: string) => {
    try {
      const res = await fetch(`${API_BASE}/menus/variants/${variantId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => {
            if (i.id === itemId && i.variants) {
              return {
                ...i,
                variants: i.variants.map((v) =>
                  v.id === variantId ? { ...v, isAvailable: !currentStatus } : v,
                ),
              };
            }
            return i;
          }),
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

  const handleAddVariantRow = () => {
    setVariants([
      ...variants,
      { variantName: '', price: 0, isAvailable: true, displayOrder: variants.length },
    ]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setVariants(variants.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index: number, field: keyof FoodVariant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) {
      setError('Please provide item name and category');
      return;
    }

    // Filter valid variants
    const validVariants = variants
      .filter((v) => v.variantName.trim().length > 0)
      .map((v, idx) => ({
        variantName: v.variantName.trim(),
        price: Number(v.price || 0),
        isAvailable: v.isAvailable !== false,
        displayOrder: idx,
      }));

    const finalBasePrice = validVariants.length > 0 ? validVariants[0].price : Number(price || 0);

    const payload = {
      restaurantId,
      categoryId,
      name: name.trim(),
      description: description.trim(),
      price: finalBasePrice,
      isVeg,
      imageUrl: image || undefined,
      variants: validVariants,
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
        setVariants([]);
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

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setPrice(250);
    setIsVeg(true);
    setImage('');
    setVariants([
      { variantName: 'Half', price: 140, isAvailable: true, displayOrder: 0 },
      { variantName: 'Full', price: 260, isAvailable: true, displayOrder: 1 },
    ]);
    setIsAddModalOpen(true);
  };

  const openEdit = (item: FoodItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setCategoryId(item.categoryId);
    setPrice(Number(item.price));
    setIsVeg(item.isVeg);
    setImage(item.imageUrl || '');
    setVariants(
      item.variants && item.variants.length > 0
        ? item.variants.map((v) => ({
            id: v.id,
            variantName: v.variantName,
            price: Number(v.price),
            isAvailable: v.isAvailable !== false,
            displayOrder: v.displayOrder || 0,
          }))
        : [],
    );
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Menu Catalog ({items.length})</h1>
          <p className="text-xs text-gray-500">Manage dishes, portion variants (Half/Full), pricing, and real-time availability</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <FolderPlus className="h-4 w-4 text-gray-500" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Menu Dish</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-[10px] font-black uppercase text-gray-400 shrink-0">Categories:</span>
        {categories.length === 0 ? (
          <span className="text-xs text-gray-400">No categories created yet</span>
        ) : (
          categories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-800"
            >
              <span>{c.name}</span>
              <button
                onClick={() => handleDeleteCategory(c.id)}
                className="text-gray-400 hover:text-rose-600"
                title="Delete category"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Menu Dishes List */}
      {items.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-xs font-bold text-gray-400 space-y-2">
          <p className="text-base text-gray-700 font-black">No Menu Dishes Added</p>
          <p>Start by creating your first food item with portion variants.</p>
          <button
            onClick={openAddModal}
            className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" /> Add Food Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl border p-5 shadow-sm space-y-4 transition ${
                item.isAvailable ? 'border-gray-100 bg-white' : 'border-gray-200 bg-gray-50/70 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                        item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                    <h3 className="text-base font-black text-gray-900 truncate">{item.name}</h3>
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2">{item.description || 'No description'}</p>
                </div>

                {item.imageUrl && (
                  <img
                    src={getImageUrl(item.imageUrl)}
                    alt={item.name}
                    className="h-16 w-16 rounded-2xl object-cover shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>

              {/* Variants Breakdown */}
              {item.variants && item.variants.length > 0 ? (
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> Portions / Variants</span>
                    <span>Price &amp; Status</span>
                  </div>
                  <div className="space-y-1.5">
                    {item.variants.map((v) => {
                      const isVarAvail = v.isAvailable !== false;
                      return (
                        <div key={v.id || v.variantName} className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-800">{v.variantName}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-900">₹{v.price}</span>
                            {v.id && (
                              <button
                                type="button"
                                onClick={() => toggleVariantAvailability(v.id!, isVarAvail, item.id)}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isVarAvail
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isVarAvail ? 'Available' : 'Disabled'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                  <span className="text-xs text-gray-500 font-medium">Standard Price:</span>
                  <span className="text-base font-black text-gray-900">₹{item.price}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                <button
                  onClick={() => toggleAvailability(item.id, item.isAvailable)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition ${
                    item.isAvailable
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{item.isAvailable ? 'Item Live' : 'Item Paused'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => duplicateItem(item.id)}
                    className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    title="Duplicate Item"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-orange-600"
                    title="Edit Item"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-rose-600"
                    title="Delete Item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {editingItem ? 'Edit Menu Dish' : 'Add New Menu Dish'}
                </h3>
                <p className="text-xs text-gray-500">Configure dish details, portion variants, and photos</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700">Dish Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chicken Biryani, Paneer Butter Masala"
                  required
                  className="mt-1 w-full rounded-2xl border border-gray-200 p-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-2xl border border-gray-200 p-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Short description of taste, ingredients, portion size"
                  className="mt-1 w-full rounded-2xl border border-gray-200 p-3 text-xs text-gray-800 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={isVeg}
                    onChange={(e) => setIsVeg(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>Pure Vegetarian</span>
                </label>
              </div>

              {/* Portion Variants Management */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-gray-900">Portion Variants (Half / Full / etc.)</h4>
                    <p className="text-[10px] text-gray-500">Add independent portion sizes with absolute prices</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="flex items-center gap-1 rounded-xl bg-orange-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-orange-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                {variants.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-gray-400 italic">No variants added. Standard dish price will be used:</p>
                    <div>
                      <label className="text-xs font-bold text-gray-700">Standard Price (₹) *</label>
                      <input
                        type="number"
                        min={0}
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-white p-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {variants.map((v, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs">
                        <input
                          type="text"
                          value={v.variantName}
                          onChange={(e) => handleVariantChange(idx, 'variantName', e.target.value)}
                          placeholder="e.g. Half, Full, Large"
                          className="flex-1 rounded-lg border border-gray-200 p-2 text-xs font-bold text-gray-900"
                        />
                        <div className="flex items-center gap-1 w-24">
                          <span className="text-xs font-bold text-gray-400">₹</span>
                          <input
                            type="number"
                            min={0}
                            value={v.price}
                            onChange={(e) => handleVariantChange(idx, 'price', Number(e.target.value))}
                            placeholder="Price"
                            className="w-full rounded-lg border border-gray-200 p-2 text-xs font-black text-gray-900"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="p-1.5 text-gray-400 hover:text-rose-600"
                          title="Remove variant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Media Upload */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Dish Image</label>
                <MediaUploader
                  value={image}
                  onChange={(url: string) => setImage(url)}
                  acceptType="image"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-2xl border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/25 hover:bg-orange-700"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Creation Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Add Menu Category</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {categoryError && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-200">
                {categoryError}
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700">Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Starters, Main Course, Breads, Desserts"
                  required
                  className="mt-1 w-full rounded-2xl border border-gray-200 p-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setCategoryError(null);
                  }}
                  disabled={isCreatingCategory}
                  className="rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                  className="rounded-2xl bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"
                >
                  {isCreatingCategory ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
