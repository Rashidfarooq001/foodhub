'use client';

import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Phone, Send, CheckCircle2 } from 'lucide-react';

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    setIsSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Customer Support</h1>
        <p className="text-xs text-gray-500">Need help with an active order or refund? We are here 24/7</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900">Toll-Free Support Line</h4>
              <p className="text-xs text-gray-500">+91 1800-419-8900 (24x7 Helpline)</p>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900">Live Support Chat</h4>
              <p className="text-xs text-gray-500">Average response time: 2 minutes</p>
            </div>
          </div>
        </div>

        {/* Ticket Form */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Submit a Support Ticket</h3>

          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              <h4 className="text-base font-bold text-emerald-900">Ticket Submitted Successfully</h4>
              <p className="text-xs text-emerald-700">Ticket #TKT-84192 created. Our support team will call you within 15 minutes.</p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-xs font-bold text-emerald-800 underline"
              >
                Create Another Ticket
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Subject / Issue Type</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Missing item in Order #FH-9482"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Message Details</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what went wrong with your order or payment..."
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-orange-700"
              >
                <Send className="h-4 w-4" /> Submit Support Request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
