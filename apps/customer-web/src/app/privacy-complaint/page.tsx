'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function PrivacyComplaintPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [category, setCategory] = useState('PRIVACY_CONCERN');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !description) {
      setFeedback({ type: 'error', message: 'Please fill in all mandatory fields (*).' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/privacy/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          orderNumber: orderNumber || undefined,
          category,
          subject,
          description,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to submit complaint');
      }

      setFeedback({
        type: 'success',
        message:
          'Your privacy grievance has been logged successfully. Our Grievance Team will acknowledge within 48 hours and resolve within 15–30 days.',
      });
      setName('');
      setEmail('');
      setPhone('');
      setOrderNumber('');
      setSubject('');
      setDescription('');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Submission failed. Please email businesscity05@gmail.com',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 py-5 px-4 sm:px-4 lg:px-5">
      <div className="mx-auto max-w-3xl space-y-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-orange-600 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-10 shadow-sm space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 border border-purple-200/60 px-3.5 py-1 text-xs font-black text-purple-800">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
              <span>Statutory Grievance Redressal Mechanism</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              File a Privacy Grievance or Security Report
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              In compliance with the Digital Personal Data Protection Act, 2023 and Consumer
              Protection (E-Commerce) Rules, 2020, submit any concerns regarding data accuracy,
              unauthorized access, consent withdrawal, or platform privacy practices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-purple-50/50 border border-purple-100 rounded-2xl text-xs">
            <div className="flex items-center gap-2 text-purple-900 font-bold">
              <Clock className="h-4 w-4 text-purple-600 shrink-0" />
              <span>48h Acknowledgement SLA</span>
            </div>
            <div className="flex items-center gap-2 text-purple-900 font-bold">
              <Mail className="h-4 w-4 text-purple-600 shrink-0" />
              <span className="truncate">businesscity05@gmail.com</span>
            </div>
            <div className="flex items-center gap-2 text-purple-900 font-bold">
              <MapPin className="h-4 w-4 text-purple-600 shrink-0" />
              <span>Kehnusa, Bandipora, J&amp;K</span>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rashid Farooq"
                  className="w-full rounded-2xl border border-gray-200 p-3 font-bold text-gray-900"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full rounded-2xl border border-gray-200 p-3 font-bold text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-2xl border border-gray-200 p-3 text-gray-900"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Order Number (if applicable)
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. ZF-2026-0801"
                  className="w-full rounded-2xl border border-gray-200 p-3 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Grievance Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 p-3 font-bold text-gray-900"
              >
                <option value="PRIVACY_CONCERN">General Personal Data Protection Inquiry</option>
                <option value="INCORRECT_DATA">Incorrect / Misleading Personal Data</option>
                <option value="UNAUTHORIZED_ACCESS">Unauthorized Account Activity</option>
                <option value="LOCATION_TRACKING">
                  Location Tracking &amp; Distance Inquiries
                </option>
                <option value="UNAUTHORIZED_SHARING">Unauthorized Third-Party Sharing</option>
                <option value="ACCOUNT_SECURITY">
                  Account Security &amp; Vulnerability Disclosure
                </option>
                <option value="OTHER">Other Compliance Matter</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Subject *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your grievance"
                className="w-full rounded-2xl border border-gray-200 p-3 font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Detailed Description *</label>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide full details, timestamps, and context regarding your personal data..."
                className="w-full rounded-2xl border border-gray-200 p-3 text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting Grievance...' : 'Submit Grievance to Zayka Food'}
            </button>
          </form>

          <div className="border-t border-gray-100 pt-6 text-[11px] text-gray-500 space-y-1">
            <p>
              <strong>Designated Grievance Authority:</strong> Zayka Food – Grievance Team
            </p>
            <p>
              <strong>Escalation / Alternate Contact:</strong> In case of urgent escalations, you
              may email businesscity05@gmail.com with subject tag [URGENT GRIEVANCE].
            </p>
            <p>
              <strong>Legal Framework:</strong> Consumer Protection (E-Commerce) Rules 2020 &amp;
              DPDP Act 2023.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
