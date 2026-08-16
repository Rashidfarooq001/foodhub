'use client';

import React, { useState, useEffect } from 'react';
import {
  Bike,
  Building2,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  MapPin,
  Phone,
  Clock,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';

const getApiBase = () =>
  typeof window !== 'undefined'
    ? getApiBaseUrl()
    : 'https://foodhub-backend-enq2.onrender.com/api/v1';

interface Rider {
  id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  avatar?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  isActive: boolean;
  createdAt?: string;
  avgRating?: number;
  completedCount?: number;
}

export default function HotelDeliveryManagementPage() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'settings' | 'staff' | 'portal' | 'analytics'>('monitor');
  const [deliveryMode, setDeliveryMode] = useState<'FOODHUB_DELIVERY' | 'RESTAURANT_SELF_DELIVERY'>('FOODHUB_DELIVERY');
  const [riders, setRiders] = useState<Rider[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Rider Form State
  const [newRider, setNewRider] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    vehicleType: 'EV Scooter',
    vehicleNumber: '',
  });

  const { user, accessToken } = useHotelAuthStore();
  const restaurantId = user?.restaurantId;

  const fetchActiveDeliveries = async () => {
    if (!restaurantId || !accessToken) return;
    setIsLoadingDeliveries(true);
    try {
      const res = await fetch(`${getApiBase()}/orders?restaurantId=${restaurantId}&limit=50`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const orders = Array.isArray(data) ? data : data.orders ?? [];
        setActiveDeliveries(orders);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoadingDeliveries(false);
    }
  };

  const fetchDeliveryData = async () => {
    if (!restaurantId) return;
    try {
      const res = await fetch(`${getApiBase()}/restaurants/${restaurantId}/delivery-staff`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.staff && Array.isArray(data.staff)) {
          setRiders(data.staff);
        }
      }
    } catch {
      /* offline */
    }
  };

  useEffect(() => {
    fetchActiveDeliveries();
    fetchDeliveryData();
  }, [restaurantId, accessToken]);

  const handleSaveDeliveryMode = async (mode: 'FOODHUB_DELIVERY' | 'RESTAURANT_SELF_DELIVERY') => {
    setDeliveryMode(mode);
    setSavingMode(true);
    setSuccessMsg(null);
    try {
      await fetch(`${getApiBase()}/restaurants/${restaurantId}/delivery-mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryMode: mode }),
      });
      setSuccessMsg(`Delivery mode updated to ${mode === 'FOODHUB_DELIVERY' ? 'FoodHub Express Delivery' : 'Restaurant Self Delivery'}`);
    } catch {
      setSuccessMsg(`Delivery mode updated locally to ${mode === 'FOODHUB_DELIVERY' ? 'FoodHub Express Delivery' : 'Restaurant Self Delivery'}`);
    } finally {
      setSavingMode(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRider.firstName || !newRider.phone) return;

    const riderObj: Rider = {
      id: `rider-${Date.now()}`,
      firstName: newRider.firstName,
      lastName: newRider.lastName,
      phone: newRider.phone,
      email: newRider.email,
      vehicleType: newRider.vehicleType,
      vehicleNumber: newRider.vehicleNumber,
      status: 'AVAILABLE',
      isActive: true,
      avgRating: 5.0,
      completedCount: 0,
    };

    setRiders((prev) => [riderObj, ...prev]);

    try {
      await fetch(`${getApiBase()}/restaurants/${restaurantId}/delivery-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRider),
      });
    } catch {
      /* offline */
    }

    setIsAddModalOpen(false);
    setNewRider({ firstName: '', lastName: '', phone: '', email: '', vehicleType: 'EV Scooter', vehicleNumber: '' });
  };

  const handleToggleRiderStatus = async (id: string) => {
    setRiders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const handleDeleteRider = async (id: string) => {
    setRiders((prev) => prev.filter((r) => r.id !== id));
  };

  const categorized = {
    waitingForRider: activeDeliveries.filter((o) => o.status === 'READY_FOR_PICKUP'),
    riderAssigned: activeDeliveries.filter((o) => o.status === 'DRIVER_ASSIGNED'),
    riderArrived: activeDeliveries.filter((o) => o.status === 'ARRIVED_AT_RESTAURANT'),
    pickedUp: activeDeliveries.filter((o) => o.status === 'PICKED_UP'),
    outForDelivery: activeDeliveries.filter((o) => o.status === 'OUT_FOR_DELIVERY'),
    completed: activeDeliveries.filter((o) => o.status === 'DELIVERED'),
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-gray-900">Live Delivery Management</h1>
            <span className="rounded-full bg-orange-100 text-orange-700 text-[10px] font-black px-2.5 py-0.5">
              REALTIME FLEET DISPATCH
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Monitor live order dispatches, rider arrival statuses, and delivery completion
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'monitor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Live Monitor ({activeDeliveries.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'settings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Delivery Settings
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'staff' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Delivery Staff ({riders.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Analytics &amp; Performance
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 0: LIVE MONITOR */}
      {activeTab === 'monitor' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900">Active Operational Deliveries</h2>
            <button
              onClick={fetchActiveDeliveries}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Section 1: Waiting for Rider */}
            <div className="rounded-3xl border border-amber-200 bg-amber-50/30 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <span className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-600" /> 1. Waiting for Rider
                </span>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-800">
                  {categorized.waitingForRider.length}
                </span>
              </div>
              {categorized.waitingForRider.length === 0 ? (
                <p className="text-xs text-gray-400 font-bold py-4 text-center">No orders currently waiting for rider</p>
              ) : (
                categorized.waitingForRider.map((ord) => (
                  <div key={ord.id} className="rounded-2xl border border-white bg-white p-4 shadow-sm space-y-2 text-xs">
                    <div className="flex justify-between font-black text-gray-900">
                      <span>Order #{ord.orderNumber}</span>
                      <span className="text-amber-600 font-bold">₹{ord.totalAmount}</span>
                    </div>
                    <p className="text-gray-500 font-bold">Status: Ready for Pickup</p>
                    <p className="text-[11px] text-gray-400">Created: {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))
              )}
            </div>

            {/* Section 2: Rider Assigned & Arriving */}
            <div className="rounded-3xl border border-blue-200 bg-blue-50/30 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                <span className="text-xs font-black uppercase text-blue-900 flex items-center gap-1.5">
                  <Bike className="h-4 w-4 text-blue-600" /> 2. Rider Assigned &amp; Arriving
                </span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-black text-blue-800">
                  {categorized.riderAssigned.length + categorized.riderArrived.length}
                </span>
              </div>
              {[...categorized.riderAssigned, ...categorized.riderArrived].length === 0 ? (
                <p className="text-xs text-gray-400 font-bold py-4 text-center">No assigned riders currently en route</p>
              ) : (
                [...categorized.riderAssigned, ...categorized.riderArrived].map((ord) => (
                  <div key={ord.id} className="rounded-2xl border border-white bg-white p-4 shadow-sm space-y-2 text-xs">
                    <div className="flex justify-between font-black text-gray-900">
                      <span>Order #{ord.orderNumber}</span>
                      <span className="text-blue-600 font-bold">{ord.status}</span>
                    </div>
                    {ord.assignedRestaurantDriver && (
                      <p className="text-gray-700 font-bold">
                        Rider: {ord.assignedRestaurantDriver.firstName} ({ord.assignedRestaurantDriver.phone})
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Section 3: Out for Delivery & Completed */}
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/30 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <span className="text-xs font-black uppercase text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 3. Out for Delivery &amp; Completed
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                  {categorized.pickedUp.length + categorized.outForDelivery.length + categorized.completed.length}
                </span>
              </div>
              {[...categorized.pickedUp, ...categorized.outForDelivery, ...categorized.completed].length === 0 ? (
                <p className="text-xs text-gray-400 font-bold py-4 text-center">No active deliveries out for customer drop</p>
              ) : (
                [...categorized.pickedUp, ...categorized.outForDelivery, ...categorized.completed].map((ord) => (
                  <div key={ord.id} className="rounded-2xl border border-white bg-white p-4 shadow-sm space-y-2 text-xs">
                    <div className="flex justify-between font-black text-gray-900">
                      <span>Order #{ord.orderNumber}</span>
                      <span className="text-emerald-700 font-bold">{ord.status}</span>
                    </div>
                    <p className="text-gray-500 font-bold">Total: ₹{ord.totalAmount}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: DELIVERY SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">Choose Merchant Delivery Mode</h2>
              <p className="text-xs text-gray-500">
                Select how orders placed at your restaurant should be dispatched to customers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: FoodHub Delivery */}
              <div
                onClick={() => handleSaveDeliveryMode('FOODHUB_DELIVERY')}
                className={`relative rounded-3xl border-2 p-6 cursor-pointer transition-all ${
                  deliveryMode === 'FOODHUB_DELIVERY'
                    ? 'border-orange-600 bg-orange-50/20 shadow-md'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                {deliveryMode === 'FOODHUB_DELIVERY' && (
                  <div className="absolute top-4 right-4 rounded-full bg-orange-600 p-1 text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20">
                    <Bike className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900">FoodHub Express Delivery</h3>
                    <p className="text-xs text-orange-600 font-bold">Default Platform Fleet</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  FoodHub automatically dispatches nearby verified delivery partners. You focus on preparing delicious food while FoodHub handles end-to-end logistics.
                </p>
              </div>

              {/* Option 2: Restaurant Self Delivery */}
              <div
                onClick={() => handleSaveDeliveryMode('RESTAURANT_SELF_DELIVERY')}
                className={`relative rounded-3xl border-2 p-6 cursor-pointer transition-all ${
                  deliveryMode === 'RESTAURANT_SELF_DELIVERY'
                    ? 'border-emerald-600 bg-emerald-50/20 shadow-md'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                {deliveryMode === 'RESTAURANT_SELF_DELIVERY' && (
                  <div className="absolute top-4 right-4 rounded-full bg-emerald-600 p-1 text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900">Restaurant Self Delivery</h3>
                    <p className="text-xs text-emerald-600 font-bold">In-House Merchant Fleet</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Use your own restaurant delivery staff. Assign orders directly from your KDS Kitchen Queue to your in-house riders and track deliveries in real time.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERY STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rider by name or phone..."
                className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700 min-h-[40px]"
            >
              <Plus className="h-4 w-4" /> Add Rider
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riders.map((rider) => (
              <div key={rider.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={rider.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={rider.firstName}
                      className="h-12 w-12 rounded-2xl object-cover border border-gray-100"
                    />
                    <div>
                      <h3 className="text-sm font-black text-gray-900">
                        {rider.firstName} {rider.lastName || ''}
                      </h3>
                      <p className="text-[11px] font-bold text-gray-500">{rider.phone}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                      rider.status === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {rider.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS & RATINGS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Avg Delivery Time</span>
            <p className="text-2xl font-black text-gray-900">22 mins</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Success Rate</span>
            <p className="text-2xl font-black text-emerald-600">99.2%</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Rider Rating</span>
            <p className="text-2xl font-black text-amber-500">★ 4.9 / 5</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Total Deliveries</span>
            <p className="text-2xl font-black text-gray-900">{activeDeliveries.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
