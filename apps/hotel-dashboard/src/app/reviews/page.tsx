'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CornerDownRight, Send, X, Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';

interface ReviewItem {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  reply: string | null;
  date: string;
}

export default function HotelReviewsPage() {
  const { user, accessToken } = useHotelAuthStore();
  const restaurantId = user?.restaurantId;

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const fetchReviews = async () => {
    if (!restaurantId) {
      setIsLoading(false);
      return;
    }

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/reviews/restaurant/${restaurantId}?limit=50`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        const rawReviews = Array.isArray(data) ? data : data.reviews || [];

        const formatted: ReviewItem[] = rawReviews.map((r: any) => {
          const custName = r.isAnonymous
            ? 'Anonymous Foodie'
            : r.customer?.user?.profile?.name || r.customer?.user?.name || 'Customer';
          const replyObj = r.replies && r.replies.length > 0 ? r.replies[0] : null;
          const dateStr = r.createdAt
            ? new Date(r.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : 'Recent';

          return {
            id: r.id,
            customerName: custName,
            rating: r.rating || 5,
            comment: r.comment || '',
            reply: replyObj?.replyText || null,
            date: dateStr,
          };
        });

        setReviews(formatted);
      }
    } catch (err) {
      console.error('Failed to load restaurant reviews', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [restaurantId, accessToken]);

  const handleSendReply = async (id: string) => {
    if (!replyText.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/reviews/${id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          role: 'OWNER',
          replyText: replyText.trim(),
        }),
      });

      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, reply: replyText.trim() } : r)),
        );
        setActiveReplyId(null);
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to post reply', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Customer Reviews &amp; Ratings
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500">
          Customer taste feedback, delivery ratings &amp; kitchen responses
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center space-y-3">
          <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
          <p className="text-base font-bold text-gray-700">No customer reviews yet</p>
          <p className="text-xs text-gray-400">Reviews submitted by customers after order delivery will show up here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => (
          <div
            key={rev.id}
            className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-gray-900">{rev.customerName}</h4>
                <p className="text-[10px] text-gray-400 font-medium">{rev.date}</p>
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800 border border-amber-200">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{rev.rating}.0</span>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed font-medium">{rev.comment}</p>

            {rev.reply ? (
              <div className="flex items-start gap-2 rounded-2xl bg-orange-50/50 p-3.5 border border-orange-100 text-xs">
                <CornerDownRight className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-orange-950 block">Merchant Reply:</span>
                  <p className="text-gray-700 mt-0.5">{rev.reply}</p>
                </div>
              </div>
            ) : (
              <div>
                {activeReplyId === rev.id ? (
                  <div className="space-y-2.5 pt-1">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your response to customer..."
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs font-medium focus:border-orange-500 focus:bg-white focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendReply(rev.id)}
                        className="rounded-2xl bg-orange-600 hover:bg-orange-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-orange-500/20 transition min-h-[40px] flex items-center gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Post Reply</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveReplyId(null);
                          setReplyText('');
                        }}
                        className="rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 min-h-[40px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveReplyId(rev.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:underline min-h-[36px]"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Reply to Review</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
