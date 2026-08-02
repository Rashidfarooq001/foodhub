'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Phone,
  ShieldCheck,
  Store,
  User,
  X,
} from 'lucide-react';

import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';

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

  const [otpModalOpen, setOtpModalOpen] =
    useState(false);

  const [enteredOtp, setEnteredOtp] =
    useState('');

  const [error, setError] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  useEffect(() => {
    if (!user || !accessToken) {
      setLoading(false);
      return;
    }

    const loadCurrentJob = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/orders/self-rider/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!res.ok) {
          setCurrentJob(null);
          return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setCurrentJob(data[0] ?? null);
        } else {
          setCurrentJob(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentJob();
  }, [user, accessToken]);

  const markPickedUp = async () => {
    if (!currentJob) return;

    const res = await fetch(
      `${API_BASE}/orders/${currentJob.id}/status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'OUT_FOR_DELIVERY',
        }),
      },
    );

    if (!res.ok) {
      alert('Unable to update order');
      return;
    }

    setCurrentJob({
      ...currentJob,
      status: 'OUT_FOR_DELIVERY',
    });
  };

  const handleVerifyOtp = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    setError('');

    const res = await fetch(
      `${API_BASE}/orders/${currentJob.id}/self-delivery-status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DELIVERED',
          otp: enteredOtp,
        }),
      },
    );

    if (!res.ok) {
      setError('Invalid OTP');
      return;
    }

    setOtpModalOpen(false);

    setSuccessMessage(
      'Order delivered successfully! Payout credited.',
    );

    setCurrentJob(null);
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading...
      </div>
    );
  }

  if (!currentJob) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        {successMessage && (
          <div className="rounded-2xl bg-emerald-500 p-4 text-white font-bold">
            {successMessage}
          </div>
        )}

        <h2 className="text-2xl font-bold">
          No Active Delivery
        </h2>

        <p className="text-gray-500">
          Accept an order to begin delivery.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
          {/* Header */}

      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">

        <div>

          <div className="flex items-center gap-2">

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">

              ACTIVE ORDER #{currentJob.orderNumber}

            </span>

            <span className="text-xs text-gray-500">

              ₹{currentJob.estimatedEarnings}

            </span>

          </div>

          <h1 className="mt-2 text-3xl font-black text-gray-900">

            Current Delivery

          </h1>

        </div>

        <div className="flex gap-2">

          {currentJob.status === 'READY_FOR_PICKUP' && (

            <button
              onClick={markPickedUp}
              className="rounded-2xl bg-orange-600 px-5 py-3 text-xs font-black text-white shadow-md hover:bg-orange-700"
            >
              Mark Food Picked Up
            </button>

          )}

          {currentJob.status === 'OUT_FOR_DELIVERY' && (

            <button
              onClick={() => setOtpModalOpen(true)}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-md hover:bg-emerald-700"
            >
              <ShieldCheck className="mr-2 inline h-4 w-4" />

              Complete Delivery

            </button>

          )}

        </div>

      </div>

      {/* COD Banner */}

      {currentJob.paymentMethod === 'COD' && (

        <div className="rounded-2xl bg-amber-500 p-4 text-white shadow-lg">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-black uppercase">

                Cash On Delivery

              </p>

              <p className="mt-1 text-lg font-black">

                Collect ₹{currentJob.codAmountToCollect}

              </p>

            </div>

            <div className="text-right text-xs font-bold">

              Verify cash before OTP

            </div>

          </div>

        </div>

      )}

      {/* Map + Sidebar */}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

        <div className="lg:col-span-2 min-h-[500px] rounded-3xl overflow-hidden border">

          <DynamicDeliveryMap
            driverLat={12.96}
            driverLng={77.61}
            restaurantLat={currentJob.restaurantLat}
            restaurantLng={currentJob.restaurantLng}
            customerLat={currentJob.customerLat}
            customerLng={currentJob.customerLng}
          />

        </div>

        <div className="space-y-6">          {/* Restaurant */}

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

            <div className="mb-3 flex items-center justify-between">

              <span className="flex items-center gap-2 text-xs font-black uppercase text-gray-400">

                <Store className="h-4 w-4 text-orange-600" />

                Pickup Store

              </span>

              <a
                href={`tel:${currentJob.restaurantPhone}`}
                className="rounded-xl bg-orange-50 p-2 text-orange-600"
              >
                <Phone className="h-4 w-4" />
              </a>

            </div>

            <h3 className="text-lg font-black">

              {currentJob.restaurantName}

            </h3>

            <p className="mt-2 text-sm text-gray-500">

              {currentJob.restaurantAddress}

            </p>

          </div>

          {/* Customer */}

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

            <div className="mb-3 flex items-center justify-between">

              <span className="flex items-center gap-2 text-xs font-black uppercase text-gray-400">

                <User className="h-4 w-4 text-emerald-600" />

                Customer

              </span>

              <a
                href={`tel:${currentJob.customerPhone}`}
                className="rounded-xl bg-emerald-50 p-2 text-emerald-600"
              >
                <Phone className="h-4 w-4" />
              </a>

            </div>

            <h3 className="text-lg font-black">

              {currentJob.customerName}

            </h3>

            <p className="mt-2 text-sm text-gray-500">

              {currentJob.customerAddress}

            </p>

          </div>

          {/* Order Items */}

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

            <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-gray-500">

              Order Items

            </h3>

            <div className="space-y-3">

              {currentJob.items?.map(
                (item: any, index: number) => (

                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-3"
                  >

                    <div>

                      <p className="font-bold text-gray-900">

                        {item.name}

                      </p>

                      <p className="text-xs text-gray-500">

                        Quantity: {item.quantity}

                      </p>

                    </div>

                  </div>

                ),
              )}

            </div>

          </div>

        </div>

      </div>
            {/* OTP Verification Modal */}

      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

            <div className="mb-5 flex items-center justify-between">

              <div className="flex items-center gap-2">

                <ShieldCheck className="h-6 w-6 text-emerald-600" />

                <h2 className="text-xl font-black">
                  Verify Delivery OTP
                </h2>

              </div>

              <button
                onClick={() => {
                  setOtpModalOpen(false);
                  setEnteredOtp('');
                  setError('');
                }}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <p className="mb-5 text-sm text-gray-500">

              Ask the customer for the delivery OTP before completing the order.

            </p>

            {error && (

              <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-600">

                {error}

              </div>

            )}

            <form
              onSubmit={handleVerifyOtp}
              className="space-y-4"
            >

              <input
                type="text"
                maxLength={4}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="1234"
                className="w-full rounded-2xl border-2 border-gray-300 p-4 text-center text-3xl font-black tracking-widest outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                className="w-full rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white hover:bg-emerald-700"
              >
                Verify OTP & Complete Delivery
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}