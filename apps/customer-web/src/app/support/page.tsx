import React from 'react';
import Link from 'next/link';
import { Mail, Clock, Phone, MapPin, ExternalLink } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Help &amp; Support</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Need help with your order or account? Get in touch with our team via email.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Contact Methods */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest text-orange-600">
              Contact Us
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 border border-orange-100">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Email Support</p>
                  <p className="text-[11px] text-gray-500 mb-2">
                    Our team usually responds within 2-4 hours.
                  </p>
                  <a
                    href="mailto:businesscity05@gmail.com"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 transition"
                  >
                    Email Support <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-gray-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-gray-600 border border-gray-100">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Operating Hours</p>
                  <p className="text-[11px] text-gray-500">10:00 AM � 11:00 PM</p>
                  <p className="text-[11px] text-gray-500">Open 7 days a week</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Policies / Links */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest text-orange-600 mb-4">
            Quick Links
          </h3>
          <div className="space-y-2">
            {[
              { title: 'Terms & Conditions', href: '/terms-and-conditions' },
              { title: 'Privacy Policy', href: '/privacy-policy' },
              { title: 'Refund Policy', href: '/refund-policy' },
              { title: 'Delivery Policy', href: '/delivery-policy' },
              { title: 'Grievance Redressal', href: '/grievance-redressal' },
            ].map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/50 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-100 transition"
              >
                {link.title}
                <ExternalLink className="h-3 w-3 opacity-50" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
