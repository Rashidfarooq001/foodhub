'use client';

import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../stores/use-delivery-auth-store';
import { io } from 'socket.io-client';
import { MapPin, Clock, Phone, CheckCircle2, AlertCircle, Navigation, Package, ShieldCheck, ExternalLink, User, Utensils, Ban } from 'lucide-react';

const API_BASE = getApiBaseUrl();

export default function ActiveJobCard({ job: currentJob, onReload }: { job: any, onReload: () => void }) {
  const { accessToken } = useDeliveryAuthStore();
  const [pickupOtp, setPickupOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!currentJob || currentJob.status !== 'OUT_FOR_DELIVERY') return;
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;

    const socketUrl = API_BASE.replace('/api/v1', '');
    const socket = io(`${socketUrl}/orders`, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => socket.emit('joinRoom', `order_${currentJob.orderId}`));

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        socket.emit('driverLocationUpdate', {
          orderId: currentJob.orderId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          driverId: currentJob.driverId,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [currentJob?.id, currentJob?.orderId, currentJob?.status, currentJob?.driverId]);

  const handleArrived = async () => {
    if (!currentJob) return;
    setError(''); setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${currentJob.id}/arrived`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to update arrival status');
      setSuccessMessage('Arrived at restaurant!');
      await onReload();
    } catch (err: any) { setError(err.message); } finally { setIsSubmitting(false); }
  };

  const handleVerifyPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentJob || !pickupOtp) return;
    setError(''); setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${currentJob.id}/verify-pickup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: pickupOtp }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Invalid pickup code');
      setSuccessMessage('Pickup verified!');
      await onReload();
    } catch (err: any) { setError(err.message); } finally { setIsSubmitting(false); }
  };

  const handleStartDelivery = async () => {
    if (!currentJob) return;
    setError(''); setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${currentJob.id}/start-delivery`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to start delivery trip');
      setSuccessMessage('Delivery trip started!');
      await onReload();
    } catch (err: any) { setError(err.message); } finally { setIsSubmitting(false); }
  };

  const handleVerifyDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentJob) return;
    setError(''); setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${currentJob.id}/delivered`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to complete delivery');
      setSuccessMessage('Delivery completed!');
      await onReload();
    } catch (err: any) { setError(err.message); } finally { setIsSubmitting(false); }
  };

  const handleUnassignJob = async () => {
    if (!currentJob || !confirm('Are you sure you want to release this order back to the pool?')) return;
    setError(''); setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${currentJob.id}/unassign`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to unassign job');
      alert('Order released.');
      await onReload();
    } catch (err: any) { setError(err.message); setIsSubmitting(false); }
  };

  const targetLat = ['ARRIVED_AT_RESTAURANT', 'OUT_FOR_DELIVERY', 'PICKED_UP'].includes(currentJob.status) ? (currentJob.deliveryLat || currentJob.deliveryAddress?.latitude) : (currentJob.pickupLat || currentJob.restaurant?.latitude);
  const targetLng = ['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(currentJob.status) ? (currentJob.deliveryLng || currentJob.deliveryAddress?.longitude) : (currentJob.pickupLng || currentJob.restaurant?.longitude);

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6 border-b-4 border-gray-100 mb-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-3">
          <div><h1 className="text-xl font-black">#{currentJob.orderNumber || currentJob.id.slice(0, 8)}</h1></div>
          <div className="flex items-center gap-2">
            <button onClick={handleUnassignJob} disabled={isSubmitting} className="rounded bg-rose-50 px-2 py-1 text-[10px] text-rose-700 font-bold">Release</button>
            <div className="rounded bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-800">{currentJob.status.replace(/_/g, ' ')}</div>
          </div>
        </div>
        <div className="flex justify-between text-xs font-bold pt-2">
          <span>Payout: ₹{currentJob.riderPayout || currentJob.estimatedEarnings || currentJob.deliveryFee || 65}</span>
        </div>
      </div>
      
      {currentJob.status === 'DRIVER_ASSIGNED' && (
        <button onClick={handleArrived} disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold p-3 rounded-xl">ARRIVED AT RESTAURANT</button>
      )}
      {currentJob.status === 'ARRIVED_AT_RESTAURANT' && (
        <form onSubmit={handleVerifyPickup} className="space-y-3">
          <input type="text" value={pickupOtp} onChange={(e) => setPickupOtp(e.target.value)} className="w-full text-center border p-3 rounded-xl" placeholder="Pickup OTP" />
          <button type="submit" disabled={isSubmitting || !pickupOtp} className="w-full bg-amber-600 text-white font-bold p-3 rounded-xl">VERIFY PICKUP</button>
        </form>
      )}
      {currentJob.status === 'PICKED_UP' && (
        <button onClick={handleStartDelivery} disabled={isSubmitting} className="w-full bg-orange-600 text-white font-bold p-3 rounded-xl">START DELIVERY</button>
      )}
      {currentJob.status === 'OUT_FOR_DELIVERY' && (
        <form onSubmit={handleVerifyDelivery} className="space-y-3">
          <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white font-bold p-3 rounded-xl">COMPLETE ORDER</button>
        </form>
      )}
    </div>
  );
}

