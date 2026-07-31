'use client';

import React, { useState, useEffect } from 'react';
import {
  Bike,
  Building2,
  Plus,
  Search,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  MapPin,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Navigation,
  KeyRound,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

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

const DEFAULT_RIDERS: Rider[] = [
  {
    id: 'rider-1',
    firstName: 'Ramesh',
    lastName: 'Kumar',
    phone: '+91 98765 12345',
    email: 'ramesh@spicegarden.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    vehicleType: 'EV Scooter',
    vehicleNumber: 'KA-01-HD-4821',
    status: 'AVAILABLE',
    isActive: true,
    avgRating: 4.9,
    completedCount: 142,
  },
  {
    id: 'rider-2',
    firstName: 'Suresh',
    lastName: 'Patel',
    phone: '+91 98765 67890',
    email: 'suresh@spicegarden.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    vehicleType: 'Motorcycle',
    vehicleNumber: 'KA-03-EV-9012',
    status: 'BUSY',
    isActive: true,
    avgRating: 4.8,
    completedCount: 98,
  },
];

export default function HotelDeliveryManagementPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'staff' | 'portal' | 'analytics'>('settings');
  const [deliveryMode, setDeliveryMode] = useState<'FOODHUB_DELIVERY' | 'RESTAURANT_SELF_DELIVERY'>('FOODHUB_DELIVERY');
  const [riders, setRiders] = useState<Rider[]>(DEFAULT_RIDERS);
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

  // Rider Portal Interactive Demo State
  const [activeRiderId, setActiveRiderId] = useState<string>('rider-1');
  const [riderOrderStatus, setRiderOrderStatus] = useState<'ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'DELIVERED'>('ACCEPTED');
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);

  const restaurantId = 'rest-1'; // Default active restaurant

  const fetchDeliveryData = async () => {
    try {
      const res = await fetch(`${getApiBase()}/restaurants/${restaurantId}/delivery-staff`);
      if (res.ok) {
        const data = await res.json();
        if (data.staff && Array.isArray(data.staff)) {
          setRiders(data.staff);
        }
      }
    } catch {
      /* offline fallback */
    }
  };

  useEffect(() => {
    fetchDeliveryData();
  }, []);

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
      /* offline fallback */
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
    try {
      await fetch(`${getApiBase()}/restaurants/${restaurantId}/delivery-staff/${id}`, {
        method: 'DELETE',
      });
    } catch {
      /* offline */
    }
  };

  const filteredRiders = riders.filter(
    (r) =>
      r.firstName.toLowerCase().includes(search.toLowerCase()) ||
      (r.phone || '').includes(search) ||
      (r.vehicleNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-gray-900">Hybrid Delivery Management</h1>
            <span className="rounded-full bg-orange-100 text-orange-700 text-[10px] font-black px-2.5 py-0.5">
              HYBRID ARCHITECTURE
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Seamlessly toggle between FoodHub Fleet &amp; In-House Self Delivery Riders
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl text-xs font-bold">
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
            onClick={() => setActiveTab('portal')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'portal' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Rider Delivery App
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Analytics &amp; Ratings
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

      {/* TAB 1: DELIVERY SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">Choose Merchant Delivery Mode</h2>
              <p className="text-xs text-gray-500">
                Select how orders placed at Spice Garden Restaurant should be dispatched to customers.
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
                <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500 border-t border-gray-100 pt-3">
                  <span>⚡ Auto Dispatch</span>
                  <span>🛡️ Full Platform Insurance</span>
                  <span>📍 GPS Tracking</span>
                </div>
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
                <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500 border-t border-gray-100 pt-3">
                  <span>🚀 Zero Commission</span>
                  <span>👥 Direct Rider Control</span>
                  <span>🔑 Custom OTP</span>
                </div>
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

          {/* Riders List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRiders.map((rider) => (
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
                        : rider.status === 'BUSY'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {rider.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-50 p-3 text-xs">
                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Vehicle</span>
                    <span className="font-black text-gray-800">{rider.vehicleType || 'Scooter'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Plate</span>
                    <span className="font-black text-gray-800">{rider.vehicleNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Rating</span>
                    <span className="font-black text-amber-600">★ {rider.avgRating || 5.0}/5</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Completed</span>
                    <span className="font-black text-gray-800">{rider.completedCount || 0} orders</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleRiderStatus(rider.id)}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold border transition ${
                      rider.isActive
                        ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {rider.isActive ? 'Suspend Rider' : 'Activate Rider'}
                  </button>
                  <button
                    onClick={() => handleDeleteRider(rider.id)}
                    className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SELF DELIVERY RIDER APP SIMULATOR */}
      {activeTab === 'portal' && (
        <div className="max-w-md mx-auto rounded-3xl border border-gray-200 bg-gray-900 text-white p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div>
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block">RIDER PORTAL</span>
              <h2 className="text-lg font-black">Self Delivery App</h2>
            </div>
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1">
              ONLINE
            </span>
          </div>

          {/* Rider Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400">Logged-in Self Delivery Rider:</label>
            <select
              value={activeRiderId}
              onChange={(e) => setActiveRiderId(e.target.value)}
              className="w-full rounded-2xl bg-gray-800 border border-gray-700 px-3 py-2 text-xs font-bold text-white focus:outline-none"
            >
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.firstName} {r.lastName || ''} ({r.vehicleNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Active Order Card */}
          <div className="rounded-2xl bg-gray-800/90 border border-gray-700 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-black text-orange-400">ORDER #FH-98421</span>
                <h3 className="text-sm font-black text-white">Rahul Sharma</h3>
              </div>
              <span className="rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-1">
                {riderOrderStatus}
              </span>
            </div>

            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
                <span>Flat 402, Sunshine Apartments, Indiranagar, Bengaluru</span>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-3 text-xs font-medium text-gray-400">
              <p>1x Paneer Butter Masala, 3x Butter Naan</p>
              <p className="text-emerald-400 font-bold mt-1">Payment: COD (₹540 to collect)</p>
            </div>

            {/* Rider Action Controls */}
            <div className="space-y-2 pt-2">
              {riderOrderStatus === 'ACCEPTED' && (
                <button
                  onClick={() => setRiderOrderStatus('PICKED_UP')}
                  className="w-full rounded-xl bg-orange-600 py-2.5 text-xs font-black text-white hover:bg-orange-500"
                >
                  Mark Order Picked Up
                </button>
              )}

              {riderOrderStatus === 'PICKED_UP' && (
                <div className="space-y-3">
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      maxLength={4}
                      value={deliveryOtpInput}
                      onChange={(e) => setDeliveryOtpInput(e.target.value)}
                      placeholder="Enter 4-Digit Customer OTP"
                      className="w-full rounded-xl bg-gray-900 border border-gray-700 py-2 pl-9 pr-3 text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  {otpError && <p className="text-[10px] text-rose-400 font-bold">Incorrect OTP. Demo OTP is 1234.</p>}

                  <button
                    onClick={() => {
                      if (deliveryOtpInput === '1234' || deliveryOtpInput.length === 4) {
                        setRiderOrderStatus('DELIVERED');
                        setOtpError(false);
                      } else {
                        setOtpError(true);
                      }
                    }}
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white hover:bg-emerald-500"
                  >
                    Verify OTP &amp; Mark Delivered
                  </button>
                </div>
              )}

              {riderOrderStatus === 'DELIVERED' && (
                <div className="rounded-xl bg-emerald-950 border border-emerald-800 p-3 text-center text-xs font-bold text-emerald-300">
                  ✓ Order Delivered Successfully!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS & RATINGS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Avg Delivery Time</span>
            <p className="text-2xl font-black text-gray-900">22 mins</p>
            <p className="text-[10px] text-emerald-600 font-bold">⚡ 4 mins faster than platform avg</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Success Rate</span>
            <p className="text-2xl font-black text-emerald-600">99.2%</p>
            <p className="text-[10px] text-gray-500 font-bold">240 completed deliveries</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Self Rider Rating</span>
            <p className="text-2xl font-black text-amber-500">★ 4.9 / 5</p>
            <p className="text-[10px] text-gray-500 font-bold">Based on 180 customer reviews</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Commission Saved</span>
            <p className="text-2xl font-black text-gray-900">₹14,400</p>
            <p className="text-[10px] text-emerald-600 font-bold">Saved using Self Delivery</p>
          </div>
        </div>
      )}

      {/* Add Rider Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">Add In-House Delivery Rider</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRider} className="space-y-4 text-xs font-bold text-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newRider.firstName}
                    onChange={(e) => setNewRider((p) => ({ ...p, firstName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-900 focus:border-orange-500 focus:outline-none"
                    placeholder="Ramesh"
                  />
                </div>
                <div>
                  <label className="block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newRider.lastName}
                    onChange={(e) => setNewRider((p) => ({ ...p, lastName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-900 focus:border-orange-500 focus:outline-none"
                    placeholder="Kumar"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  value={newRider.phone}
                  onChange={(e) => setNewRider((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-900 focus:border-orange-500 focus:outline-none"
                  placeholder="+91 98765 12345"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Vehicle Type</label>
                  <select
                    value={newRider.vehicleType}
                    onChange={(e) => setNewRider((p) => ({ ...p, vehicleType: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-900 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="EV Scooter">EV Scooter</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Vehicle Plate Number</label>
                  <input
                    type="text"
                    value={newRider.vehicleNumber}
                    onChange={(e) => setNewRider((p) => ({ ...p, vehicleNumber: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-900 focus:border-orange-500 focus:outline-none"
                    placeholder="KA-01-HD-9999"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-orange-600 py-2.5 text-xs font-black text-white hover:bg-orange-700 shadow-md shadow-orange-500/20"
                >
                  Save Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
