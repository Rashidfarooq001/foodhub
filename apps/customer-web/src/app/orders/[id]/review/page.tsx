'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, CheckCircle2, MessageSquare } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

function StarRating({
  label,
  value,
  onChange,
}: {
  label:    string;
  value:    number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                n <= (hover || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OrderReviewPage() {
  const params  = useParams<{ id: string }>();
  const router  = useRouter();

  const [restaurantRating, setRestaurantRating] = useState(0);
  const [restaurantComment, setRestaurantComment] = useState('');
  const [foodRating, setFoodRating]   = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [driverComment, setDriverComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted,  setSubmitted]    = useState(false);

  const handleSubmit = async () => {
    if (!restaurantRating || !foodRating || !driverRating) {
      alert('Please rate all three categories before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const apiBase = getApiBaseUrl();
      const token = typeof window !== 'undefined' ? localStorage.getItem('foodhub_customer_token') : null;

      if (!token) {
        alert('Please log in to submit a review.');
        setSubmitting(false);
        return;
      }

      // 1. Fetch order details to retrieve restaurantId and driverId
      const orderRes = await fetch(`${apiBase}/orders/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        alert(errData.message || 'Unable to retrieve order details for review.');
        setSubmitting(false);
        return;
      }

      const order = await orderRes.json();
      const restaurantId = order?.restaurantId || order?.restaurant?.id;
      const driverId = order?.assignedFoodhubDriverId || order?.assignedRestaurantDriverId || order?.driver?.id;

      // 2. Submit Restaurant Review
      let reviewSuccess = false;
      if (restaurantId) {
        const revRes = await fetch(`${apiBase}/reviews/restaurant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: params.id,
            restaurantId,
            rating: restaurantRating,
            comment: restaurantComment || undefined,
            isAnonymous,
          }),
        });

        if (revRes.ok) {
          reviewSuccess = true;
        } else {
          const revErr = await revRes.json().catch(() => ({}));
          alert(revErr.message || 'Failed to submit restaurant review.');
          setSubmitting(false);
          return;
        }
      }

      // 3. Submit Driver Review
      if (driverId) {
        await fetch(`${apiBase}/reviews/driver`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: params.id,
            driverId,
            rating: driverRating,
            comment: driverComment || undefined,
          }),
        }).catch(() => {});
      }

      if (reviewSuccess || !restaurantId) {
        setSubmitted(true);
      }
    } catch {
      alert('Network error submitting review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-6 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-500" />
        <h2 className="text-2xl font-black text-gray-900">Thank You!</h2>
        <p className="mt-2 text-sm text-gray-500">Your review helps others make better choices.</p>
        <button
          id="go-to-orders-btn"
          onClick={() => router.push('/orders')}
          className="mt-6 rounded-2xl bg-purple-600 px-8 py-3 text-sm font-black text-white shadow-lg hover:bg-purple-700"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 sm:p-6">
      <div className="mx-auto max-w-lg space-y-4">

        <div className="pb-2">
          <h1 className="text-2xl font-black text-gray-900">Rate Your Experience</h1>
          <p className="mt-1 text-xs text-gray-500">Order #{params.id?.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Restaurant Review Card */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-black text-gray-900 text-sm uppercase tracking-wide text-purple-600">🍽 Restaurant</h3>

          <div className="space-y-3">
            <StarRating label="Overall Experience" value={restaurantRating} onChange={setRestaurantRating} />
          </div>

          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
            <textarea
              id="restaurant-review-comment"
              rows={2}
              value={restaurantComment}
              onChange={(e) => setRestaurantComment(e.target.value)}
              placeholder="How was the food quality, packaging, portion size?"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-purple-400 resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="anonymous-review-toggle"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded accent-purple-600"
            />
            <span className="text-xs text-gray-500">Post anonymously</span>
          </label>
        </div>

        {/* Food Review Card */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
          <h3 className="font-black text-gray-900 text-sm uppercase tracking-wide text-amber-600">🍱 Food Items</h3>
          <div className="space-y-3">
            <StarRating label="Taste & Quality"     value={foodRating} onChange={setFoodRating} />
          </div>
        </div>

        {/* Driver Review Card */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-black text-gray-900 text-sm uppercase tracking-wide text-blue-600">🛵 Delivery Partner</h3>
          <div className="space-y-3">
            <StarRating label="Behaviour & Speed"    value={driverRating} onChange={setDriverRating} />
          </div>

          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
            <textarea
              id="driver-review-comment"
              rows={2}
              value={driverComment}
              onChange={(e) => setDriverComment(e.target.value)}
              placeholder="Was the delivery on time? Was the partner professional?"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-purple-400 resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          id="submit-review-btn"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 py-4 text-sm font-black text-white shadow-lg hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>

      </div>
    </div>
  );
}
