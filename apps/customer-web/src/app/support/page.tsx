'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useAuthStore } from '../../stores/use-auth-store';

const API_BASE = getApiBaseUrl();

interface SubmittedTicket {
  id: string;
  ticketNo: string;
  subject: string;
  status: string;
  createdAt: string;
}

export default function SupportPage() {
  const { user, accessToken } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [category, setCategory] = useState('Order Issue / Item Missing');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<{ ticketNo: string; subject: string; id: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentTickets, setRecentTickets] = useState<SubmittedTicket[]>([]);

  // Auto-fill customer profile details if logged in
  useEffect(() => {
    if (user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
      if (fullName) setName(fullName);
      if (user.phone) setPhone(user.phone);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  // Load recently created tickets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('zayka_submitted_tickets');
      if (stored) {
        setRecentTickets(JSON.parse(stored));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMessage('Please describe your issue in the message details field.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const fullSubject = orderNumber ? `[Order #${orderNumber}] ${category}` : category;

    const payload = {
      subject: fullSubject,
      message: message.trim(),
      priority,
      name: name || undefined,
      phone: phone || undefined,
      email: email || undefined,
      orderNumber: orderNumber || undefined,
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`${API_BASE}/support-tickets`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create support ticket. Please try again.');
      }

      const ticket = await res.json();
      const newTicket: SubmittedTicket = {
        id: ticket.id || String(Date.now()),
        ticketNo: ticket.ticketNo || `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        subject: fullSubject,
        status: ticket.status || 'OPEN',
        createdAt: new Date().toISOString(),
      };

      setCreatedTicket({
        ticketNo: newTicket.ticketNo,
        subject: fullSubject,
        id: newTicket.id,
      });

      // Save to recent tickets
      const updated = [newTicket, ...recentTickets.filter((t) => t.ticketNo !== newTicket.ticketNo)].slice(0, 5);
      setRecentTickets(updated);
      try {
        localStorage.setItem('zayka_submitted_tickets', JSON.stringify(updated));
      } catch {
        /* ignore */
      }

      // Reset form fields
      setMessage('');
      setOrderNumber('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to submit support ticket. Please check your internet connection or email businesscity05@gmail.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Help &amp; Customer Support</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Need help with an order, payment, delivery, or menu query? Our Bandipora operations team is here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Column: Official Contact & Desk Details */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
            <h3 className="text-base font-black text-gray-900">Official Support Helpdesk</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              For fastest resolution of order-specific issues, submit a ticket using the form. All tickets are logged directly into our administration control center with guaranteed acknowledgment.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-50/60 border border-orange-100">
                <Mail className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-orange-800 tracking-wider">Official Support Email</span>
                  <p className="text-xs font-bold text-gray-900">businesscity05@gmail.com</p>
                  <p className="text-[11px] text-gray-500">General support &amp; order escalations</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <MapPin className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Operating Hub</span>
                  <p className="text-xs font-bold text-gray-900">Kehnusa, Bandipora, Jammu &amp; Kashmir – 193502</p>
                  <p className="text-[11px] text-gray-500">Hyper-local food delivery operations</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <Clock className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Helpdesk Hours</span>
                  <p className="text-xs font-bold text-gray-900">Mon – Sun: 8:00 AM – 11:00 PM IST</p>
                  <p className="text-[11px] text-gray-500">Active restaurant &amp; rider operational hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Legal & Grievance Links */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Policies &amp; Grievances</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <Link
                href="/refund-policy"
                className="p-2.5 rounded-2xl bg-gray-50 hover:bg-orange-50 hover:text-orange-700 transition font-bold text-gray-700 flex items-center justify-between"
              >
                <span>Refund Policy</span>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/delivery-policy"
                className="p-2.5 rounded-2xl bg-gray-50 hover:bg-orange-50 hover:text-orange-700 transition font-bold text-gray-700 flex items-center justify-between"
              >
                <span>Delivery Policy</span>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/grievance-redressal"
                className="p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 transition font-bold flex items-center justify-between sm:col-span-2"
              >
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  <span>Statutory Grievance Redressal (48h SLA)</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-purple-400" />
              </Link>
            </div>
          </div>

          {/* Recent Submitted Tickets (if any) */}
          {recentTickets.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Your Recent Tickets</h4>
              <div className="space-y-2">
                {recentTickets.map((t) => (
                  <div key={t.ticketNo} className="p-3 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-orange-700">{t.ticketNo}</span>
                      <p className="text-[11px] text-gray-700 font-bold truncate max-w-[200px]">{t.subject}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Support Ticket Form */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xl font-black text-gray-900">Submit a Support Ticket</h3>
              <p className="text-xs text-gray-500">
                Tickets are transmitted directly to our Admin Control Center for real-time tracking and response.
              </p>
            </div>

            {createdTicket ? (
              <div className="flex flex-col items-center justify-center p-5 text-center space-y-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-emerald-950">Ticket Submitted Successfully</h4>
                  <p className="text-xs font-bold text-emerald-800">
                    Ticket <span className="text-emerald-900 bg-emerald-200/60 px-2 py-0.5 rounded-md font-mono font-black">{createdTicket.ticketNo}</span> has been created.
                  </p>
                  <p className="text-[11px] text-emerald-700 max-w-md pt-1">
                    Our operations team in Kehnusa has received your ticket and will investigate your inquiry promptly.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setCreatedTicket(null)}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition"
                  >
                    Submit Another Ticket
                  </button>
                  <Link
                    href="/"
                    className="px-5 py-2.5 rounded-2xl border border-emerald-300 text-emerald-900 font-bold text-xs hover:bg-emerald-100/50 transition"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rashid Farooq"
                      className="w-full rounded-2xl border border-gray-200 p-3 font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-2xl border border-gray-200 p-3 font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-gray-200 p-3 text-gray-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Order Number (if applicable)</label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="e.g. ZF-2026-0801"
                      className="w-full rounded-2xl border border-gray-200 p-3 font-mono text-gray-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Issue Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 p-3 font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                    >
                      <option value="Order Issue / Item Missing">Order Issue / Missing Item</option>
                      <option value="Delivery Delay / Driver Location">Delivery Delay / Driver Issue</option>
                      <option value="Food Quality / Packaging">Food Quality / Packaging Concern</option>
                      <option value="Payment / Refund Status">Payment / Refund Status Inquiry</option>
                      <option value="Account / Profile Issue">Account / Login Assistance</option>
                      <option value="Restaurant Menu Inquiry">Restaurant / Menu Inquiry</option>
                      <option value="Other Assistance">Other General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Urgency Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full rounded-2xl border border-gray-200 p-3 font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                    >
                      <option value="LOW">Low (General question)</option>
                      <option value="MEDIUM">Medium (Order inquiry)</option>
                      <option value="HIGH">High (Active delivery issue)</option>
                      <option value="URGENT">Urgent (Payment / Food emergency)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Message / Issue Details *</label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide details about your inquiry, order items, or situation so we can resolve it immediately..."
                    className="w-full rounded-2xl border border-gray-200 p-3 text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700 transition disabled:opacity-50 min-h-[44px]"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Transmitting Ticket to Admin Desk...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Support Ticket</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
