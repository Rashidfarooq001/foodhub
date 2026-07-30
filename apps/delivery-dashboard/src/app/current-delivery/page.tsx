'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useActiveDeliveryStore } from '../../stores/use-active-delivery-store';
import { Phone, MapPin, CheckCircle2, ShieldCheck, Navigation, Store, User, X } from 'lucide-react';

const DynamicDeliveryMap = dynamic(
  () => import('../../components/navigation/DeliveryMap').then((m) => m.DeliveryMap),
  { ssr: false },
);

export default function CurrentDeliveryPage() {
  const { currentJob, verifyOtpAndComplete, markPickedUp } = useActiveDeliveryStore();

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [error, setError] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  if (!currentJob) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        {successMessage && (
          <div className="mb-6 rounded-2xl bg-emerald-500 p-4 text-sm font-bold text-white shadow-lg">
            {successMessage}
          </div>
        )}
        <h2 className="text-2xl font-bold text-gray-900">No active delivery right now</h2>
        <p className="text-xs text-gray-500">Check Available Orders feed to accept a new delivery job.</p>
      </div>
    );
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const success = verifyOtpAndComplete(enteredOtp);
    if (success) {
      setOtpModalOpen(false);
      setSuccessMessage('Order delivered successfully! Payout credited to your wallet.');
    } else {
      setError('Invalid 4-digit OTP. Please ask the customer for the correct code.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
              ACTIVE ORDER #{currentJob.orderNumber}
            </span>
            <span className="text-xs text-gray-500">Estimated Payout: ₹{currentJob.estimatedEarnings}</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mt-1">GPS Navigation & Dispatch</h1>
        </div>

        <div className="flex gap-2">
          {currentJob.status === 'ASSIGNED' && (
            <button
              onClick={markPickedUp}
              className="rounded-2xl bg-orange-600 px-5 py-3 text-xs font-black text-white shadow-md hover:bg-orange-700"
            >
              Mark Food Picked Up
            </button>
          )}

          {currentJob.status === 'PICKED_UP' && (
            <button
              onClick={() => setOtpModalOpen(true)}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
            >
              <ShieldCheck className="inline-block h-4 w-4 mr-1" /> Complete Delivery (Enter OTP)
            </button>
          )}
        </div>
      </div>

      {/* COD Cash Collection Alert Banner */}
      {currentJob.paymentMethod === 'COD' && (
        <div className="flex items-center justify-between rounded-2xl bg-amber-500 p-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider">
              CASH ON DELIVERY
            </span>
            <p className="text-sm font-black">
              Collect ₹{currentJob.codAmountToCollect ?? 620} Cash from Customer upon delivery
            </p>
          </div>
          <span className="text-xs font-bold text-amber-100">
            Confirm cash received before completing order
          </span>
        </div>
      )}

      {/* Map & Addresses Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Leaflet Map */}
        <div className="lg:col-span-2 min-h-[450px]">
          <DynamicDeliveryMap
            driverLat={12.9600}
            driverLng={77.6100}
            restaurantLat={currentJob.restaurantLat}
            restaurantLng={currentJob.restaurantLng}
            customerLat={currentJob.customerLat}
            customerLng={currentJob.customerLng}
          />
        </div>

        {/* Addresses Sidebar */}
        <div className="space-y-6">
          {/* Restaurant Details */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Store className="h-4 w-4 text-orange-600" /> Pickup Store
              </span>
              <a
                href={`tel:${currentJob.restaurantPhone}`}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
            <h4 className="text-base font-bold text-gray-900">{currentJob.restaurantName}</h4>
            <p className="text-xs text-gray-500">{currentJob.restaurantAddress}</p>
          </div>

          {/* Customer Details */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <User className="h-4 w-4 text-emerald-600" /> Drop Location
              </span>
              <a
                href={`tel:${currentJob.customerPhone}`}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
            <h4 className="text-base font-bold text-gray-900">{currentJob.customerName}</h4>
            <p className="text-xs text-gray-500">{currentJob.customerAddress}</p>
          </div>

          {/* Items Summary */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Order Items</h4>
            <div className="space-y-1 border-t border-gray-100 pt-3">
              {currentJob.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs font-medium text-gray-800">
                  <span>{item.quantity}x {item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* OTP Delivery Complete Modal */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
                <h3 className="text-lg font-black text-gray-900">Enter Delivery OTP</h3>
              </div>
              <button onClick={() => setOtpModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">Ask customer {currentJob.customerName} for the 4-digit security OTP to complete this delivery.</p>

            {error && (
              <div className="rounded-xl bg-rose-50 p-3 text-center text-xs font-bold text-rose-600 border border-rose-100">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                maxLength={4}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="4819"
                className="w-full rounded-2xl border-2 border-gray-200 p-4 text-center text-3xl font-black tracking-widest text-gray-900 focus:border-emerald-500 focus:outline-none"
              />

              <button
                type="submit"
                className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-700"
              >
                Verify OTP & Complete Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
