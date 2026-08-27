'use client';

import React, { useState } from 'react';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { getApiBaseUrl } from '@foodhub/config';

import { useAuthStore } from '../../stores/use-auth-store';

const getApiBase = () => (typeof window !== 'undefined' ? getApiBaseUrl() : 'https://foodhub-backend-enq2.onrender.com/api/v1');

const DEFAULT_REVIEWS = [
  {
    id: 'rv-1',
    restaurantName: 'Spice Garden',
    rating: 5,
    comment: 'Amazing food! Super fast delivery and great packaging.',
    date: '24 Jul 2026',
    helpful: 12,
  },
  {
    id: 'rv-2',
    restaurantName: 'Pizza Paradise',
    rating: 4,
    comment: 'Loved the pizza, will order again.',
    date: '18 Jul 2026',
    helpful: 5,
  },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const router = useRouter();
  const [helpedIds, setHelpedIds] = useState<string[]>([]);
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);

  React.useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = useAuthStore.getState().accessToken;
        const res = await fetch(`${getApiBase()}/reviews/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setReviews(data);
          }
        }
      } catch { /* fallback */ }
    };
    fetchReviews();
  }, []);

  const markHelpful = (id: string) => {
    setHelpedIds((prev) => prev.includes(id) ? prev : [...prev, id]);
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 p-4 sm:p-4">
      <div className="mx-auto max-w-lg space-y-5">

        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">My Reviews</h1>
            <p className="text-xs text-gray-400">{reviews.length} reviews submitted</p>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="py-10 text-center">
            <MessageSquare className="mx-auto mb-3 h-12 w-12 text-gray-200" />
            <p className="text-gray-400">No reviews yet. Order something delicious!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-black text-gray-900">{review.restaurantName}</p>
                  <p className="text-xs text-gray-400">{review.date}</p>
                </div>
                <StarRow rating={review.rating} />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              <div className="flex items-center justify-between pt-1">
                <button
                  id={`helpful-btn-${review.id}`}
                  onClick={() => markHelpful(review.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    helpedIds.includes(review.id)
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Helpful ({review.helpful + (helpedIds.includes(review.id) ? 1 : 0)})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
