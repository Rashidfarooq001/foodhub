'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Copy,
  Layers,
  FolderPlus,
  Sparkles,
  UtensilsCrossed,
  Image as ImageIcon,
} from 'lucide-react';
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

  const restaurantId = user?.restaurantId;

  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  // Category Form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Food Item Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number>(250);
  const [isVeg, setIsVeg] = useState(true);
  const [image, setImage] = useState('');
  const [variants, setVariants] = useState<FoodVariant[]>([]);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  const fetchMenuAndCategories = async () => {
    if (!restaurantId) return;
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
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuAndCategories();
  }, [restaurantId]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !restaurantId) return;

    setIsCreatingCategory(true);
    setCategoryError(null);

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
        await fetchMenuAndCategories();
      } else {
        const errData = await res.json().catch(() => ({}));
        setCategoryError(errData.message || 'Failed to create category.');
      }
    } catch (err: any) {
      setCategoryError(err.message || 'Network error while creating category.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Delete this category and its items?')) return;
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

  const toggleItemAvailability = async (id: string, currentStatus: boolean) => {
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

  const openAddItemModal = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setPrice(250);
    setIsVeg(true);
    setImage('');
    setVariants([]);
    setItemError(null);
    if (categories.length > 0) {
      setCategoryId(selectedCatId !== 'ALL' ? selectedCatId : categories[0].id);
    }
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: FoodItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setPrice(Number(item.price));
    setIsVeg(item.isVeg);
    setImage(item.imageUrl || '');
    setCategoryId(item.categoryId);
    setVariants(
      item.variants?.map((v) => ({
        id: v.id,
        variantName: v.variantName,
        price: Number(v.price),
        isAvailable: v.isAvailable ?? true,
        displayOrder: v.displayOrder ?? 0,
      })) || [],
    );
    setItemError(null);
    setIsItemModalOpen(true);
  };

  const handleAddVariantRow = (presetName = '') => {
    setVariants((prev) => [
      ...prev,
      {
        variantName: presetName,
        price: price || 0,
        isAvailable: true,
        displayOrder: prev.length,
      },
    ]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index: number, field: keyof FoodVariant, value: any) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setItemError('Dish Name is required.');
      return;
    }
    if (name.trim().toLowerCase() === 'menu') {
      setItemError('Please provide a valid dish name.');
      return;
    }
    const numPrice = Number(price);
    if (variants.length === 0 && (isNaN(numPrice) || numPrice <= 0)) {
      setItemError('Base price must be a valid number greater than 0.');
      return;
    }
    if (!categoryId || !restaurantId) {
      setItemError('Category and Restaurant ID are required.');
      return;
    }

    setIsSavingItem(true);
    setItemError(null);

    const payload = {
      restaurantId,
      categoryId,
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      isVeg,
      imageUrl: image || null,
      variants: variants.map((v, i) => ({
        variantName: v.variantName.trim(),
        price: Number(v.price),
        isAvailable: v.isAvailable ?? true,
        displayOrder: i,
      })),
    };

    try {
      let res;
      if (editingItem) {
        res = await fetch(`${API_BASE}/menus/items/${editingItem.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/menus/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsItemModalOpen(false);
        await fetchMenuAndCategories();
      } else {
        const errData = await res.json().catch(() => ({}));
        setItemError(errData.message || 'Failed to save food item.');
      }
    } catch (err: any) {
      setItemError(err.message || 'Network error while saving food item.');
    } finally {
      setIsSavingItem(false);
    }
  };

  const filteredItems = selectedCatId === 'ALL'
    ? items
    : items.filter((i) => i.categoryId === selectedCatId);

  if (!restaurantId) {
    return (
      <div className="p-8 text-center text-xs font-bold text-gray-500">
        Restaurant not found. Please log in again.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Menu Catalog &amp; Variants
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Manage categories, portion sizes (Half/Full), pricing &amp; live availability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2.5 text-xs font-bold text-gray-700 transition min-h-[44px]"
          >
            <FolderPlus className="h-4 w-4 text-gray-500" />
            <span>+ Category</span>
          </button>

          <button
            onClick={openAddItemModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-2xl bg-orange-600 hover:bg-orange-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-orange-500/20 transition min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Dish</span>
          </button>
        </div>
      </div>

      {/* Category Horizontal Pill Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCatId('ALL')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition min-h-[40px] ${
            selectedCatId === 'ALL'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Categories ({items.length})
        </button>

        {categories.map((cat) => {
          const count = items.filter((i) => i.categoryId === cat.id).length;
          const isSelected = selectedCatId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition min-h-[40px] flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-orange-700 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Food Items List Cards (Mobile-first responsive list) */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 text-center text-xs font-bold text-gray-400">
            Loading menu items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 p-6 space-y-3">
            <UtensilsCrossed className="h-10 w-10 mx-auto text-gray-300" />
            <p>No dishes found in this category.</p>
            <button
              onClick={openAddItemModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-black text-white hover:bg-orange-700 transition"
            >
              <Plus className="h-4 w-4" />
              Add First Dish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredItems.map((item) => {
              const hasVariants = item.variants && item.variants.length > 0;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl sm:rounded-3xl border bg-white p-4 shadow-sm space-y-3 flex flex-col justify-between transition ${
                    item.isAvailable ? 'border-gray-200' : 'border-rose-200 bg-rose-50/20 opacity-80'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top row: Image + Title + Main Price */}
                    <div className="flex gap-3">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0 relative border border-gray-100">
                        {item.imageUrl ? (
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                        )}
                        <span className={`absolute top-1.5 left-1.5 h-3 w-3 rounded-full border border-white ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-black text-sm sm:text-base text-gray-900 truncate">
                            {item.name}
                          </h3>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                            {item.description}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-sm sm:text-base font-black text-gray-900">
                            ₹{item.price ?? 0}
                          </span>
                          {hasVariants && (
                            <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                              {item.variants!.length} Variants
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Variants Breakdown if any */}
                    {hasVariants && (
                      <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                          PORTION SIZES &amp; PRICES
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {item.variants!.map((v, vIdx) => (
                            <div
                              key={vIdx}
                              className="flex items-center justify-between bg-white border border-gray-200 px-2 py-1 rounded-lg text-xs"
                            >
                              <span className="font-bold text-gray-800 text-[11px]">{v.variantName}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-orange-600 text-[11px]">₹{v.price}</span>
                                {v.id && (
                                  <button
                                    onClick={() => toggleVariantAvailability(v.id!, v.isAvailable ?? true, item.id)}
                                    className={`text-[9px] font-black px-1 rounded ${
                                      v.isAvailable !== false ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                                    }`}
                                    title="Toggle Variant Availability"
                                  >
                                    {v.isAvailable !== false ? 'ON' : 'OFF'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions & Item Availability Toggle */}
                  <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                    {/* 44px Touch Item Availability Switch */}
                    <button
                      onClick={() => toggleItemAvailability(item.id, item.isAvailable)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[44px] ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${item.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{item.isAvailable ? 'Available' : 'Sold Out'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditItemModal(item)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                        title="Edit Dish"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => duplicateItem(item.id)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Dish"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. ADD CATEGORY BOTTOM SHEET / DIALOG                                    */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-black text-gray-900">Add Menu Category</h2>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {categoryError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
                {categoryError}
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Biryani &amp; Rice, Starters, Beverages"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 rounded-2xl border border-gray-200 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCategory}
                  className="flex-1 rounded-2xl bg-orange-600 hover:bg-orange-700 py-3 text-xs font-black text-white shadow-md shadow-orange-500/20 transition min-h-[44px]"
                >
                  {isCreatingCategory ? 'Saving...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADD / EDIT FOOD ITEM & VARIANTS BOTTOM SHEET / DIALOG                 */}
      {/* ========================================================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 sticky top-0 bg-white z-10">
              <h2 className="text-base sm:text-lg font-black text-gray-900">
                {editingItem ? 'Edit Dish & Variants' : 'Add New Dish'}
              </h2>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {itemError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
                {itemError}
              </div>
            )}

            <form onSubmit={handleSaveFoodItem} className="space-y-4">
              {/* Dish Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mutton Rogan Josh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none min-h-[44px]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe ingredients, cooking style, portion information..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-medium text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Category & Base Price (2-col on tablet) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none min-h-[44px]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Dietary Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                <span className="text-xs font-bold text-gray-800">Dietary Classification</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVeg(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition min-h-[40px] ${
                      isVeg ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    Veg
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVeg(false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition min-h-[40px] ${
                      !isVeg ? 'bg-rose-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    Non-Veg
                  </button>
                </div>
              </div>

              {/* Image Uploader */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Dish Photograph
                </label>
                <MediaUploader
                  value={image}
                  onChange={(url) => setImage(url)}
                  acceptType="image"
                />
              </div>

              {/* ============================================================= */}
              {/* PORTION VARIANTS SECTION (Half / Full / Large / Regular)       */}
              {/* ============================================================= */}
              <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-orange-950 uppercase tracking-wide">
                      Portion Sizes &amp; Variants
                    </h3>
                    <p className="text-[10px] text-orange-800">
                      Add size options (e.g. Half, Full) with authoritative prices
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddVariantRow()}
                    className="flex items-center gap-1 rounded-xl bg-orange-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm hover:bg-orange-700 transition min-h-[36px]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Variant</span>
                  </button>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setVariants([
                        { variantName: 'Half', price: Math.round(price * 0.6), isAvailable: true, displayOrder: 0 },
                        { variantName: 'Full', price: price, isAvailable: true, displayOrder: 1 },
                      ]);
                    }}
                    className="text-[10px] font-bold bg-white border border-orange-300 text-orange-800 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition"
                  >
                    + Preset: Half / Full
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVariants([
                        { variantName: 'Regular', price: price, isAvailable: true, displayOrder: 0 },
                        { variantName: 'Medium', price: Math.round(price * 1.3), isAvailable: true, displayOrder: 1 },
                        { variantName: 'Large', price: Math.round(price * 1.6), isAvailable: true, displayOrder: 2 },
                      ]);
                    }}
                    className="text-[10px] font-bold bg-white border border-orange-300 text-orange-800 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition"
                  >
                    + Preset: Reg / Med / Lrg
                  </button>
                </div>

                {/* Variant Rows */}
                {variants.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {variants.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded-xl"
                      >
                        <input
                          type="text"
                          required
                          placeholder="Variant Name (e.g. Half)"
                          value={v.variantName}
                          onChange={(e) => handleVariantChange(idx, 'variantName', e.target.value)}
                          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs font-bold text-gray-900 focus:outline-none min-h-[38px]"
                        />

                        <div className="relative w-24">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                          <input
                            type="number"
                            required
                            min={0}
                            placeholder="Price"
                            value={v.price}
                            onChange={(e) => handleVariantChange(idx, 'price', Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-6 pr-2 py-2 text-xs font-bold text-gray-900 focus:outline-none min-h-[38px]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="h-9 w-9 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0"
                          title="Remove variant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex gap-2 sticky bottom-0 bg-white pb-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="flex-1 rounded-2xl border border-gray-200 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 min-h-[44px]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingItem}
                  className="flex-1 rounded-2xl bg-orange-600 hover:bg-orange-700 py-3 text-xs font-black text-white shadow-md shadow-orange-500/20 transition min-h-[44px]"
                >
                  {isSavingItem ? 'Saving Dish...' : editingItem ? 'Save Changes' : 'Publish Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
