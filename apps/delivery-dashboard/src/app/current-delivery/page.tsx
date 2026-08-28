'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Phone,
  ShieldCheck,
  Store,
  User,
  Navigation,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  Package,
} from 'lucide-react';

import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { io } from 'socket.io-client';

const API_BASE = getApiBaseUrl();

export default function CurrentDeliveryPage() {
  const { user, accessToken } = useDeliveryAuthStore();

  const [currentJob, setCurrentJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // OTP inputs
  const [pickupOtp, setPickupOtp] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadCurrentJob = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/delivery/current`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        setCurrentJob(null);
        return;
      }

      const data = await res.json();
      setCurrentJob(data || null);
    } catch {
      /* offline */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentJob();
  }, [accessToken]);

  // Real Driver GPS streaming during active delivery
  useEffect(() => {
    if (!currentJob || currentJob.status !== 'OUT_FOR_DELIVERY') return;
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;

    const socketUrl = API_BASE.replace('/api/v1', '');
    const socket = io(`${socketUrl}/orders`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('joinOrder', { orderId: currentJob.orderId || currentJob.id });
    });

    let lastEmit = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const now = Date.now();
        if (now - lastEmit > 5000) {
          lastEmit = now;
          socket.emit('updateLocation', {
            orderId: currentJob.orderId || currentJob.id,
            lat: latitude,
            lng: longitude,
          });
          fetch(`${API_BASE}/delivery/me/heartbeat`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          }).catch(console.error);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [currentJob?.id, currentJob?.orderId, currentJob?.status]);

  const handleArrived = async () => {
    if (!currentJob) return;
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${currentJob.id}/arrived`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update arrival status');
      }

      setSuccessMessage('Arrived at restaurant! Ask staff for 4-digit pickup code.');
      await loadCurrentJob();
    } catch (err: any) {
      setError(err.message || 'Failed to update arrival status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentJob || !pickupOtp) return;
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${currentJob.id}/verify-pickup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp: pickupOtp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid pickup code');
      }

      setSuccessMessage('Pickup verified successfully! Start delivery trip.');
      setPickupOtp('');
      await loadCurrentJob();
    } catch (err: any) {
      setError(err.message || 'Failed to verify pickup OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartDelivery = async () => {
    if (!currentJob) return;
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${currentJob.id}/start-delivery`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to start delivery trip');
      }

      setSuccessMessage('Delivery trip started! Navigate to customer address.');
      await loadCurrentJob();
    } catch (err: any) {
      setError(err.message || 'Failed to start delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentJob) return;
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${currentJob.id}/complete-delivery`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid delivery OTP provided by customer');
      }

      setSuccessMessage('Order delivered successfully! Payout added to your settlement ledger.');
      setDeliveryOtp('');
      await loadCurrentJob();
    } catch (err: any) {
      setError(err.message || 'Failed to verify delivery OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassignJob = async () => {
    if (!currentJob || !accessToken) return;
    if (!confirm('Are you sure you want to unassign and release this active order back to the queue?')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${currentJob.id}/unassign`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        setSuccessMessage('Order released successfully.');
        await loadCurrentJob();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.message || 'Failed to unassign job');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs font-bold text-gray-400">
        Loading active delivery console...
      </div>
    );
  }

  if (!currentJob) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-6 space-y-3">
        <Navigation className="h-10 w-10 mx-auto text-gray-300 mb-1" />
        <h2 className="text-base font-black text-gray-900">No Active Delivery Job</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          You do not have any active delivery assigned. Head over to available orders to pick up a delivery request.
        </p>
      </div>
    );
  }

  const restaurantPhone = currentJob.restaurantPhone || currentJob.restaurant?.phone;
  const customerPhone = currentJob.customerPhone || currentJob.customer?.phone;
  const destinationLat = currentJob.deliveryLat || currentJob.deliveryAddress?.latitude;
  const destinationLng = currentJob.deliveryLng || currentJob.deliveryAddress?.longitude;
  const restaurantLat = currentJob.pickupLat || currentJob.restaurant?.latitude;
  const restaurantLng = currentJob.pickupLng || currentJob.restaurant?.longitude;

  // Active Target for Navigation depending on status
  const targetLat = currentJob.status === 'ARRIVED_AT_RESTAURANT' || currentJob.status === 'OUT_FOR_DELIVERY' || currentJob.status === 'PICKED_UP'
    ? destinationLat
    : restaurantLat;
  const targetLng = currentJob.status === 'ARRIVED_AT_RESTAURANT' || currentJob.status === 'OUT_FOR_DELIVERY' || currentJob.status === 'PICKED_UP'
    ? destinationLng
    : restaurantLng;

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12">
      {/* Messages */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Top Bar: Order ID + Status */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase block">Current Active Job</span>
            <h1 className="text-lg sm:text-xl font-black text-gray-900">
              #{currentJob.orderNumber || currentJob.id.slice(0, 8)}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUnassignJob}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-200 bg-gray-50 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 px-3 py-1 text-[11px] font-bold text-gray-600 transition"
            >
              Release Order
            </button>
            <span className="rounded-xl bg-orange-100 text-orange-800 border border-orange-200 px-3 py-1 text-xs font-black uppercase">
              {currentJob.status?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Lifecycle Step Progress */}
        <div className="grid grid-cols-4 gap-1 text-center pt-1">
          <div className={`p-1.5 rounded-xl text-[9px] font-black uppercase ${
            ['DRIVER_ASSIGNED', 'ARRIVED_AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentJob.status)
              ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'
          }`}>
            1. Assigned
          </div>
          <div className={`p-1.5 rounded-xl text-[9px] font-black uppercase ${
            ['ARRIVED_AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentJob.status)
              ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'
          }`}>
            2. Arrived
          </div>
          <div className={`p-1.5 rounded-xl text-[9px] font-black uppercase ${
            ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentJob.status)
              ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'
          }`}>
            3. Picked Up
          </div>
          <div className={`p-1.5 rounded-xl text-[9px] font-black uppercase ${
            currentJob.status === 'DELIVERED'
              ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'
          }`}>
            4. Delivered
          </div>
        </div>
      </div>

      {/* Restaurant Card with Call & Address */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Pickup Location</span>
              <h3 className="font-black text-sm text-gray-900">{currentJob.restaurantName || 'Restaurant Kitchen'}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                {currentJob.restaurantAddress || currentJob.restaurant?.address || 'Restaurant address in city'}
              </p>
            </div>
          </div>

          {restaurantPhone && (
            <a
              href={`tel:${restaurantPhone}`}
              className="flex items-center gap-1 rounded-xl bg-orange-50 border border-orange-200 px-3 py-2 text-xs font-black text-orange-800 hover:bg-orange-100 transition min-h-[40px] shrink-0"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Call</span>
            </a>
          )}
        </div>
      </div>

      {/* Customer Card with Call & Destination */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <User className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Delivery Destination</span>
              <h3 className="font-black text-sm text-gray-900">{currentJob.customerName || 'Customer'}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                {currentJob.customerAddress || currentJob.deliveryAddress?.formattedAddress || 'Customer delivery address'}
              </p>
            </div>
          </div>

          {customerPhone && (
            <a
              href={`tel:${customerPhone}`}
              className="flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-100 transition min-h-[40px] shrink-0"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Call</span>
            </a>
          )}
        </div>
      </div>

      {/* One-Touch Real GPS Navigation Button */}
      {targetLat && targetLng && (
        <a
          href={`https://www.mappls.com/direction?dir_destination=${targetLat},${targetLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-500/25 transition min-h-[44px]"
        >
          <Navigation className="h-4 w-4" />
          <span>Open Mappls Turn-by-Turn Navigation</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {/* ===================================================================== */}
      {/* OPERATIONAL LIFECYCLE ACTION PANELS                                   */}
      {/* ===================================================================== */}

      {/* 1. If assigned -> Arrived at Restaurant */}
      {currentJob.status === 'DRIVER_ASSIGNED' && (
        <div className="rounded-2xl sm:rounded-3xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-blue-900 uppercase">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Step 1: Arrive at Restaurant</span>
          </div>
          <p className="text-xs text-blue-800">
            Head to the restaurant kitchen. Once you arrive at the counter, tap the button below.
          </p>
          <button
            onClick={handleArrived}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 py-3.5 text-xs font-black text-white shadow-md transition min-h-[44px]"
          >
            <span>{isSubmitting ? 'Updating...' : 'I HAVE ARRIVED AT RESTAURANT'}</span>
          </button>
        </div>
      )}

      {/* 2. If arrived at restaurant -> Verify Pickup OTP */}
      {currentJob.status === 'ARRIVED_AT_RESTAURANT' && (
        <div className="rounded-2xl sm:rounded-3xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            <span>Step 2: Enter 4-Digit Pickup OTP</span>
          </div>
          <p className="text-xs text-amber-800">
            Ask the restaurant kitchen staff for the 4-digit pickup code shown on their KDS.
          </p>

          <form onSubmit={handleVerifyPickup} className="space-y-3">
            <input
              type="text"
              required
              maxLength={6}
              placeholder="Enter Pickup Code"
              value={pickupOtp}
              onChange={(e) => setPickupOtp(e.target.value)}
              className="w-full text-center text-xl font-mono font-black tracking-widest rounded-2xl border border-amber-300 bg-white py-3 text-gray-900 focus:outline-none min-h-[44px]"
            />
            <button
              type="submit"
              disabled={isSubmitting || !pickupOtp}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 py-3.5 text-xs font-black text-white shadow-md transition min-h-[44px]"
            >
              <span>{isSubmitting ? 'Verifying...' : 'VERIFY PICKUP & RECEIVE PACKAGE'}</span>
            </button>
          </form>
        </div>
      )}

      {/* 3. If picked up -> Start Delivery Trip */}
      {currentJob.status === 'PICKED_UP' && (
        <div className="rounded-2xl sm:rounded-3xl border border-orange-200 bg-orange-50/50 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-orange-900 uppercase">
            <Navigation className="h-4 w-4 text-orange-600" />
            <span>Step 3: Start Delivery Trip</span>
          </div>
          <p className="text-xs text-orange-800">
            Package collected in delivery bag. Tap below to start your trip towards customer location.
          </p>
          <button
            onClick={handleStartDelivery}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-700 py-3.5 text-xs font-black text-white shadow-md transition min-h-[44px]"
          >
            <span>{isSubmitting ? 'Starting...' : 'START DELIVERY TRIP'}</span>
          </button>
        </div>
      )}

      {/* 4. If Out for Delivery -> Complete Delivery */}
      {currentJob.status === 'OUT_FOR_DELIVERY' && (
        <div className="rounded-2xl sm:rounded-3xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-900 uppercase">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Step 4: Customer Handover</span>
          </div>
          <p className="text-xs text-emerald-800">
            Hand over food package to customer and confirm completion.
          </p>

          <form onSubmit={handleVerifyDelivery} className="space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 text-xs font-black text-white shadow-md transition min-h-[44px]"
            >
              <span>{isSubmitting ? 'Verifying...' : 'COMPLETE ORDER & RECORD EARNINGS'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
