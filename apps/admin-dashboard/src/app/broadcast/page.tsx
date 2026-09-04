'use client';

import React, { useState } from 'react';
import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { getApiBaseUrl } from '@foodhub/config';
import { Megaphone, Send } from 'lucide-react';

export default function BroadcastPage() {
  const { accessToken } = useAdminAuthStore();
  const [audience, setAudience] = useState('CUSTOMERS');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setLoading(true);
    setStatusMsg('');

    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/notifications/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ audience, title, message, url }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg('Broadcast queued successfully!');
        setTitle('');
        setMessage('');
        setUrl('');
      } else {
        setStatusMsg(`Error: ${data.message || 'Failed to send'}`);
      }
    } catch (err: any) {
      setStatusMsg('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
          <Megaphone className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broadcast Notifications</h1>
          <p className="text-sm text-gray-500">Send push notifications to specific user groups.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            >
              <option value="CUSTOMERS">Customers</option>
              <option value="RESTAURANTS">Restaurants (Hotel Dashboard)</option>
              <option value="RIDERS">Delivery Partners (Rider Dashboard)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notification Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              placeholder="e.g. System Maintenance, Promotional Offer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition resize-none"
              placeholder="Your message here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action URL (Optional)</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              placeholder="e.g. /orders or https://example.com"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className={`text-sm font-medium ${statusMsg.includes('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
              {statusMsg}
            </span>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 h-11 px-6 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Broadcast'}
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
