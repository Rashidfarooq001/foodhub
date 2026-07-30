'use client';

import React, { useState } from 'react';
import {
  Gift, Copy, Check, Share2, Users, TrendingUp, ChevronRight,
} from 'lucide-react';

const MOCK_CODE  = 'FH-A3BK9Z';
const MOCK_STATS = { totalReferrals: 4, totalEarned: 200 };

export default function ReferralPage() {
  const [copied,    setCopied]    = useState(false);
  const [applyCode, setApplyCode] = useState('');
  const [applying,  setApplying]  = useState(false);
  const [applyMsg,  setApplyMsg]  = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(MOCK_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      void navigator.share({
        title: 'Join FoodHub!',
        text:  `Use my code ${MOCK_CODE} and get ₹30 off your first order!`,
        url:   `https://foodhub.app/join?ref=${MOCK_CODE}`,
      });
    } else {
      handleCopy();
    }
  };

  const handleApply = async () => {
    if (!applyCode.trim()) return;
    setApplying(true);
    setApplyMsg('');
    await new Promise((r) => setTimeout(r, 800));
    if (applyCode.toUpperCase() === MOCK_CODE) {
      setApplyMsg('❌ You cannot use your own referral code');
    } else {
      setApplyMsg(`✅ Code applied! ₹30 bonus added to your wallet.`);
    }
    setApplying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 sm:p-6">
      <div className="mx-auto max-w-lg space-y-6">

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 to-pink-500 p-6 text-white shadow-2xl">
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />
          <Gift className="mb-3 h-10 w-10" />
          <h1 className="text-2xl font-black">Refer & Earn</h1>
          <p className="mt-1 text-sm text-purple-100">
            Invite friends to FoodHub. You earn <strong>₹50</strong>, they get <strong>₹30</strong>.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 rounded-2xl bg-white/20 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-bold text-purple-100 uppercase tracking-wider">Your Code</p>
              <p className="mt-0.5 text-2xl font-black tracking-widest">{MOCK_CODE}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                id="copy-referral-code-btn"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-bold backdrop-blur-sm hover:bg-white/30"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                id="share-referral-btn"
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-bold backdrop-blur-sm hover:bg-white/30"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Users, label: 'Friends Joined', value: MOCK_STATS.totalReferrals, color: 'text-purple-600', bg: 'bg-purple-50' },
            { icon: TrendingUp, label: 'Total Earned', value: `₹${MOCK_STATS.totalEarned}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((s) => (
            <div key={s.label} className={`rounded-3xl ${s.bg} p-5`}>
              <s.icon className={`h-6 w-6 ${s.color} mb-2`} />
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="text-base font-black text-gray-900">How It Works</h2>
          {[
            { step: '1', text: 'Share your unique referral code with friends' },
            { step: '2', text: 'Friend signs up & places their first order' },
            { step: '3', text: 'You get ₹50 · They get ₹30 in wallet' },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-black text-purple-700">
                {s.step}
              </div>
              <p className="text-sm text-gray-600">{s.text}</p>
              <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0 ml-auto" />
            </div>
          ))}
        </div>

        {/* Apply referral code */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="text-base font-black text-gray-900">Have a Friend's Code?</h2>
          <p className="text-xs text-gray-500">Enter a referral code to claim your ₹30 welcome bonus.</p>
          <div className="flex gap-2">
            <input
              id="apply-referral-input"
              type="text"
              value={applyCode}
              onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
              placeholder="FH-XXXXXX"
              maxLength={8}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold tracking-widest uppercase outline-none focus:border-purple-400"
            />
            <button
              id="apply-referral-btn"
              onClick={handleApply}
              disabled={applying}
              className="rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-black text-white shadow hover:bg-purple-700 disabled:opacity-50"
            >
              {applying ? '…' : 'Apply'}
            </button>
          </div>
          {applyMsg && (
            <p className="text-xs font-medium text-gray-700">{applyMsg}</p>
          )}
        </div>

      </div>
    </div>
  );
}
