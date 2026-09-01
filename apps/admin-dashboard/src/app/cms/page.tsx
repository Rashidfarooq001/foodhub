'use client';

import React, { useState } from 'react';
import { Plus, Image, CheckCircle2, Trash2, X } from 'lucide-react';

export default function AdminCmsPage() {
  const [banners, setBanners] = useState<
    Array<{ id: string; title: string; subtitle: string; active: boolean }>
  >([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('zaykafood-cms-banners');
      if (stored) {
        setBanners(JSON.parse(stored));
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveBanners = (
    updated: Array<{ id: string; title: string; subtitle: string; active: boolean }>,
  ) => {
    setBanners(updated);
    try {
      localStorage.setItem('zaykafood-cms-banners', JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const next = [
      ...banners,
      {
        id: `b-${Date.now()}`,
        title: title.trim(),
        subtitle: subtitle.trim() || 'Special promotion on ZaykaFood',
        active: true,
      },
    ];
    saveBanners(next);
    setTitle('');
    setSubtitle('');
    setShowModal(false);
  };

  const handleDeleteBanner = (id: string) => {
    const next = banners.filter((b) => b.id !== id);
    saveBanners(next);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            CMS &amp; Promotional Banners
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Manage customer app hero offer banners, featured promotions &amp; homepage campaigns
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-purple-500/20 transition min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span>Add Hero Banner</span>
        </button>
      </div>

      {/* Banner Grid */}
      {!isLoaded ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center">
          <p className="text-xs font-bold text-gray-400">Loading campaign banners...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center space-y-3">
          <Image className="mx-auto h-12 w-12 text-gray-300" />
          <p className="text-base font-bold text-gray-700">No active hero banners</p>
          <p className="text-xs text-gray-400">
            Click &quot;Add Hero Banner&quot; above to create a promotional banner for the customer
            app homepage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {banners.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm sm:text-base font-black text-gray-900">{b.title}</h3>
                  <button
                    onClick={() => handleDeleteBanner(b.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                    title="Remove Banner"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">{b.subtitle}</p>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-xl">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Active on Home Feed
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Bottom Sheet */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Add Hero Campaign Banner</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddBanner} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Banner Headline *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 50% OFF Weekend Craze"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Subtitle / Offer Description
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Valid on orders above ₹199"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-2xl border border-gray-200 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-purple-600 hover:bg-purple-700 py-3 text-xs font-black text-white shadow-md shadow-purple-500/20 transition min-h-[44px]"
                >
                  Publish Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
