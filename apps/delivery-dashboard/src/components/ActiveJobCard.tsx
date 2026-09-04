'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../stores/use-delivery-auth-store';
import { io } from 'socket.io-client';
import { MapPin, Navigation } from 'lucide-react';

const API_BASE = getApiBaseUrl();

export default function ActiveJobCard({ job: currentJob, onReload }: { job: any, onReload: () => void }) {
  const { accessToken } = useDeliveryAuthStore();
  const [pickupOtp, setPickupOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [driverLat, setDriverLat] = useState<number | null>(null);
  const [driverLng, setDriverLng] = useState<number | null>(null);
  const lastEmitTime = useRef(0);

  useEffect(() => {
    if (!currentJob) return;
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;

    const socketUrl = API_BASE.replace('/api/v1', '');
    const socket = io(`${socketUrl}/orders`, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => socket.emit('joinRoom', `order_${currentJob.orderId}`));

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setDriverLat(latitude);
        setDriverLng(longitude);

        // Throttle emission to once every 10 seconds
        const now = Date.now();
        if (now - lastEmitTime.current > 10000) {
          socket.emit('driverLocationUpdate', {
            orderId: currentJob.orderId,
            lat: latitude,
            lng: longitude,
            driverId: currentJob.driverId,
          });
          lastEmitTime.current = now;
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [currentJob?.id, currentJob?.orderId, currentJob?.driverId]);

  const executeAction = async (endpoint: string, method: string = 'POST', body?: any) => {
    if (!currentJob) return;
    setError(''); setIsSubmitting(true); setSuccessMessage('');
    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${currentJob.id}/${endpoint}`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error((await res.json()).message || `Failed to execute ${endpoint}`);
      await onReload();
    } catch (err: any) { setError(err.message); } finally { setIsSubmitting(false); }
  };

  const isBeforePickup = ['DRIVER_ASSIGNED', 'ARRIVED_AT_RESTAURANT'].includes(currentJob.status);
  const destLat = isBeforePickup ? currentJob.restaurantLat : currentJob.customerLat;
  const destLng = isBeforePickup ? currentJob.restaurantLng : currentJob.customerLng;

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6 border-b-4 border-gray-100 mb-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h1 className="text-xl font-black">#{currentJob.orderNumber || currentJob.id.slice(0, 8)}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => {
              if (confirm('Are you sure you want to release this order?')) {
                executeAction('unassign');
              }
            }} disabled={isSubmitting} className="rounded bg-rose-50 px-2 py-1 text-[10px] text-rose-700 font-bold">Release</button>
            <div className="rounded bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-800">{currentJob.status.replace(/_/g, ' ')}</div>
          </div>
        </div>
        <div className="flex justify-between text-xs font-bold pt-2">
          <span>Payout: ₹{currentJob.riderPayout || currentJob.estimatedEarnings || currentJob.deliveryFee || 65}</span>
          <span className="text-gray-500">{currentJob.distanceKm ? `${currentJob.distanceKm.toFixed(1)} km` : 'Calculating...'}</span>
        </div>
      </div>

      {error && <div className="text-sm font-bold text-rose-600 bg-rose-50 p-3 rounded-xl">{error}</div>}
      
      {/* NAVIGATION */}
      {destLat && destLng && (
        <div className="flex items-center justify-between rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
          <div className="text-sm font-black text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            {isBeforePickup ? 'Navigate to Restaurant' : 'Navigate to Customer'}
          </div>
          <a
            href={`https://mappls.com/direction?start=${driverLat || ''},${driverLng || ''}&end=${destLat},${destLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-bold bg-gray-900 text-white px-3 py-2 rounded-xl hover:bg-gray-700"
          >
            <Navigation className="w-3.5 h-3.5" />
            Open Navigation
          </a>
        </div>
      )}
      
      {/* ACTION BUTTONS */}
      {currentJob.status === 'DRIVER_ASSIGNED' && (
        <button onClick={() => executeAction('arrived')} disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold p-3 rounded-xl">ARRIVED AT RESTAURANT</button>
      )}
      {currentJob.status === 'ARRIVED_AT_RESTAURANT' && (
        <form onSubmit={(e) => { e.preventDefault(); executeAction('verify-pickup', 'POST', { otp: pickupOtp }); }} className="space-y-3">
          <input type="text" value={pickupOtp} onChange={(e) => setPickupOtp(e.target.value)} className="w-full text-center border p-3 rounded-xl font-bold tracking-widest text-lg" placeholder="Enter Pickup OTP" />
          <button type="submit" disabled={isSubmitting || !pickupOtp} className="w-full bg-amber-600 text-white font-bold p-3 rounded-xl">VERIFY PICKUP</button>
        </form>
      )}
      {currentJob.status === 'PICKED_UP' && (
        <button onClick={() => executeAction('start-delivery')} disabled={isSubmitting} className="w-full bg-orange-600 text-white font-bold p-3 rounded-xl">START DELIVERY</button>
      )}
      {currentJob.status === 'OUT_FOR_DELIVERY' && (
        <form onSubmit={(e) => { e.preventDefault(); executeAction('delivered'); }} className="space-y-3">
          <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white font-bold p-3 rounded-xl">COMPLETE DELIVERY</button>
        </form>
      )}
    </div>
  );
}

