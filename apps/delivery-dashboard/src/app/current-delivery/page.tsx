'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Phone,
  ShieldCheck,
  Store,
  User,
  X,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  QrCode,
} from 'lucide-react';

import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { io } from 'socket.io-client';

const API_BASE = getApiBaseUrl();

const DynamicDeliveryMap = dynamic(
  () =>
    import('../../components/navigation/DeliveryMap').then(
      (m) => m.DeliveryMap,
    ),
  {
    ssr: false,
  },
);

export default function CurrentDeliveryPage() {
  const { user, accessToken } = useDeliveryAuthStore();

  const [currentJob, setCurrentJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // OTP inputs
  const [pickupOtp, setPickupOtp] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadCurrentJob = async () => {
    if (!user || !accessToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/delivery/current`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        setCurrentJob(null);
        return;
      }

      const data = await res.json();
      setCurrentJob(data || null);
    } catch (err) {
      console.error('Failed to fetch current job:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentJob();
  }, [user, accessToken]);

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

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        socket.emit('updateLocation', {
          orderId: currentJob.orderId || currentJob.id,
          lat: latitude,
          lng: longitude,
        });
      },
      (err) => {
        console.warn('Geolocation watcher warning:', err.message);
      },
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

      setSuccessMessage('Pickup verified successfully!');
      setPickupOtp('');
      await loadCurrentJob();
    } catch (err: any) {
      setError(err.message || 'Failed to verify pickup OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPickupQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentJob || !qrTokenInput) return;
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${currentJob.id}/verify-pickup-qr`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrToken: qrTokenInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid QR token');
      }

      setSuccessMessage('Pickup verified via QR token successfully!');
      setQrTokenInput('');
      setQrModalOpen(false);
      await loadCurrentJob();
    } catch (err: any) {
      setError(err.message || 'Failed to verify QR token');
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
        throw new Error(data.message || 'Failed to start delivery');
      }

      setSuccessMessage('Trip started! Proceed to customer delivery address.');
      await loadCurrentJob();
    } catch (err: any) {
      setError(err.message || 'Failed to start delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentJob || !deliveryOtp) return;
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${currentJob.id}/verify-delivery`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp: deliveryOtp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid customer delivery OTP');
      }

      setSuccessMessage('Order delivered successfully! Earnings credited to wallet.');
      setDeliveryOtp('');
      setCurrentJob(null);
    } catch (err: any) {
      setError(err.message || 'Failed to verify delivery OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!currentJob) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm max-w-lg mx-auto my-12 space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">No Active Delivery Job</h2>
        <p className="text-xs text-gray-500">
          You currently have no active trip. Ensure your status is set to 🟢 ONLINE to receive dispatches.
        </p>
      </div>
    );
  }

  const orderStatus = currentJob.status || currentJob.jobStatus;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Alert Banners */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 shadow-sm flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="p-1 hover:bg-emerald-100 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Status Card */}
      <div className="rounded-3xl bg-gray-900 p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
              TRIP #{currentJob.orderNumber}
            </span>
            <span className="text-xs font-bold text-gray-400">Payout: ₹{currentJob.riderPayout}</span>
          </div>
          <h1 className="text-2xl font-black mt-2 text-white">{currentJob.restaurantName}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{currentJob.restaurantAddress}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentJob.restaurantLat && currentJob.restaurantLng && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${currentJob.restaurantLat},${currentJob.restaurantLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-2xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-700 transition-all shadow-md"
            >
              <Navigation className="h-4 w-4" /> Navigate to Restaurant
            </a>
          )}
          <a
            href={`tel:${currentJob.restaurantPhone}`}
            className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
          >
            <Phone className="h-4 w-4" /> Call Restaurant
          </a>
        </div>
      </div>

      {/* STEP 1: DRIVER_ASSIGNED -> ARRIVED */}
      {orderStatus === 'DRIVER_ASSIGNED' && (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-600">STEP 1: EN ROUTE TO RESTAURANT</span>
            <span className="text-xs font-bold text-gray-500">Distance: {currentJob.distanceKm} km</span>
          </div>

          <p className="text-xs text-gray-600 font-medium">
            Navigate to <strong>{currentJob.restaurantName}</strong> and tap <strong>I HAVE ARRIVED AT RESTAURANT</strong> once you reach the location.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentJob.restaurantLat && currentJob.restaurantLng ? (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${currentJob.restaurantLat},${currentJob.restaurantLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-orange-50 border border-orange-200 py-3.5 text-xs font-black text-orange-700 hover:bg-orange-100 transition"
              >
                <Navigation className="h-4 w-4" /> OPEN RESTAURANT NAVIGATION
              </a>
            ) : (
              <div className="text-xs text-gray-400 font-bold p-3">Restaurant location coordinates pending</div>
            )}

            <button
              disabled={isSubmitting}
              onClick={handleArrived}
              className="rounded-2xl bg-emerald-600 py-3.5 text-xs font-black text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'I HAVE ARRIVED AT RESTAURANT'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ARRIVED_AT_RESTAURANT -> PICKUP VERIFICATION */}
      {orderStatus === 'ARRIVED_AT_RESTAURANT' && (
        <div className="rounded-3xl border-2 border-emerald-500/30 bg-emerald-50/50 p-6 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-emerald-200/50 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">STEP 2: PICKUP VERIFICATION REQUIRED</span>
              <h3 className="text-lg font-black text-gray-900">Arrived at {currentJob.restaurantName}</h3>
            </div>
            <button
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-black text-white shadow-sm hover:bg-purple-700"
            >
              <QrCode className="h-4 w-4" /> SCAN QR
            </button>
          </div>

          <form onSubmit={handleVerifyPickup} className="space-y-4">
            <label className="block text-xs font-bold text-gray-700">
              Ask restaurant staff for the 4-digit pickup code:
            </label>
            <div className="flex items-center gap-3 max-w-xs">
              <input
                type="text"
                maxLength={4}
                value={pickupOtp}
                onChange={(e) => setPickupOtp(e.target.value)}
                placeholder="1234"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-center text-xl font-black tracking-widest text-gray-900 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmitting || pickupOtp.length !== 4}
                className="rounded-2xl bg-emerald-600 px-6 py-3.5 text-xs font-black text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50 shrink-0"
              >
                {isSubmitting ? 'Verifying...' : 'VERIFY & PICK UP'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: PICKED_UP -> START DELIVERY */}
      {orderStatus === 'PICKED_UP' && (
        <div className="rounded-3xl border border-emerald-500/30 bg-white p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-black">
              PICKED UP ✓
            </span>
            <span className="text-xs font-bold text-gray-500">Ready to start journey</span>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-gray-500 uppercase">Customer Information</h4>
            <p className="text-base font-black text-gray-900">{currentJob.customerName}</p>
            <p className="text-xs text-gray-600">{currentJob.customerAddress}</p>
          </div>

          <button
            disabled={isSubmitting}
            onClick={handleStartDelivery}
            className="w-full rounded-2xl bg-emerald-600 py-4 text-xs font-black text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Navigation className="h-4 w-4" /> {isSubmitting ? 'Starting...' : 'START DELIVERY TO CUSTOMER'}
          </button>
        </div>
      )}

      {/* STEP 4: OUT_FOR_DELIVERY -> CUSTOMER VERIFICATION */}
      {orderStatus === 'OUT_FOR_DELIVERY' && (
        <div className="rounded-3xl border-2 border-teal-500/30 bg-teal-50/40 p-6 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-teal-200/50 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-800 block">STEP 4: OUT FOR DELIVERY</span>
              <h3 className="text-lg font-black text-gray-900">Deliver to {currentJob.customerName}</h3>
            </div>
            <a
              href={`tel:${currentJob.customerPhone}`}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-black text-white shadow-sm hover:bg-teal-700"
            >
              <Phone className="h-4 w-4" /> CALL CUSTOMER
            </a>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-teal-100 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-500 block uppercase">Destination Address</span>
              {currentJob.customerLat && currentJob.customerLng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${currentJob.customerLat},${currentJob.customerLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-black text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl hover:bg-teal-100 transition"
                >
                  <Navigation className="h-3.5 w-3.5" /> Open Navigation
                </a>
              )}
            </div>
            <p className="font-bold text-gray-900 text-sm">{currentJob.customerAddress}</p>
          </div>

          <form onSubmit={handleVerifyDelivery} className="space-y-4">
            <label className="block text-xs font-bold text-gray-700">
              Ask customer for 4-digit delivery verification OTP:
            </label>
            <div className="flex items-center gap-3 max-w-xs">
              <input
                type="text"
                maxLength={4}
                value={deliveryOtp}
                onChange={(e) => setDeliveryOtp(e.target.value)}
                placeholder="1234"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-center text-xl font-black tracking-widest text-gray-900 focus:border-teal-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmitting || deliveryOtp.length !== 4}
                className="rounded-2xl bg-teal-600 px-6 py-3.5 text-xs font-black text-white shadow-lg hover:bg-teal-700 disabled:opacity-50 shrink-0"
              >
                {isSubmitting ? 'Verifying...' : 'MARK DELIVERED'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items Breakdown */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">Order Package Items</h4>
        <div className="divide-y divide-gray-100">
          {(currentJob.items || []).map((item: any, idx: number) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-900">{item.quantity}x {item.name}</span>
              <span className="text-gray-500 font-bold">₹{item.unitPrice}</span>
            </div>
          ))}
        </div>
      </div>

      {/* QR Scanner Token Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Scan QR Code Token</h3>
              <button onClick={() => setQrModalOpen(false)} className="rounded-full p-1 hover:bg-gray-100 text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyPickupQr} className="space-y-4">
              <label className="block text-xs font-bold text-gray-700">
                Scan or paste signed QR token from restaurant display:
              </label>
              <textarea
                rows={3}
                value={qrTokenInput}
                onChange={(e) => setQrTokenInput(e.target.value)}
                placeholder="Paste signed QR token payload here..."
                className="w-full rounded-2xl border border-gray-300 p-3 text-xs font-mono text-gray-900 focus:border-purple-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmitting || !qrTokenInput}
                className="w-full rounded-2xl bg-purple-600 py-3 text-xs font-black text-white shadow-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying QR...' : 'VERIFY QR PICKUP'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}