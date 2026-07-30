'use client';

import React, { useState } from 'react';
import { Star, MessageSquare, CornerDownRight } from 'lucide-react';

export default function HotelReviewsPage() {
  const [reviews, setReviews] = useState([
    {
      id: 'r1',
      customerName: 'Rahul Sharma',
      rating: 5,
      comment: 'Super fast delivery and piping hot Paneer Butter Masala! Loved the packaging.',
      reply: 'Thank you Rahul! Glad you enjoyed the meal!',
      date: 'Yesterday',
    },
    {
      id: 'r2',
      customerName: 'Priya Patel',
      rating: 4,
      comment: 'Biryani tasted delicious, but extra spicy as requested.',
      reply: null,
      date: '2 days ago',
    },
  ]);

  const [replyText, setReplyText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const handleSendReply = (id: string) => {
    if (!replyText) return;
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, reply: replyText } : r)),
    );
    setActiveReplyId(null);
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Reviews & Ratings</h1>
        <p className="text-xs text-gray-500">Customer feedback, ratings, and merchant responses</p>
      </div>

      <div className="space-y-4">
        {reviews.map((rev) => (
          <div key={rev.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-900">{rev.customerName}</h4>
                <p className="text-[10px] text-gray-400">{rev.date}</p>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {rev.rating}/5
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>

            {rev.reply ? (
              <div className="flex items-start gap-2 rounded-2xl bg-orange-50/50 p-4 border border-orange-100 text-xs">
                <CornerDownRight className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-orange-900">Merchant Reply:</span>
                  <p className="text-gray-700 mt-1">{rev.reply}</p>
                </div>
              </div>
            ) : (
              <div>
                {activeReplyId === rev.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write merchant reply..."
                      className="w-full rounded-2xl border border-gray-200 p-3 text-xs focus:border-orange-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendReply(rev.id)}
                        className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow"
                      >
                        Post Reply
                      </button>
                      <button
                        onClick={() => setActiveReplyId(null)}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveReplyId(rev.id)}
                    className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Reply to Review
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
