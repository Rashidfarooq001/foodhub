import React from 'react';
import { Metadata } from 'next';
import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Cookie Policy | Zayka Food',
  description:
    'Official Cookie & Storage Policy of Zayka Food detailing the essential cookies and local storage tokens used for session authentication and website functionality.',
  alternates: {
    canonical: 'https://zaykafood.online/cookie-policy',
  },
};

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie & Storage Policy"
      subtitle="How Zayka Food uses essential cookies and local storage tokens for session authentication, cart persistence, and secure platform functionality."
      lastUpdated="February 2026"
    >
      {/* 1. What are Cookies & Local Storage */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>1.</span> What Are Cookies and Local Storage?
        </h2>
        <p className="text-sm text-gray-700">
          Cookies are small text files placed on your browser or device when you visit websites.
          Local storage (
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">localStorage</code> and{' '}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">sessionStorage</code>) is a
          standard browser technology that allows web applications to store key-value data locally
          within your browser for fast, secure performance.
        </p>
      </section>

      {/* 2. Audit of Storage Used by Zayka Food */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>2.</span> Storage Technologies Actually Used on Zayka Food
        </h2>
        <p className="text-sm text-gray-700">
          Based on our technical architecture, Zayka Food uses storage exclusively for essential
          operational and functional purposes:
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left border border-gray-200 rounded-2xl overflow-hidden">
            <thead className="bg-gray-100 text-gray-900 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 border-b border-gray-200">Key / Storage Name</th>
                <th className="p-3.5 border-b border-gray-200">Type</th>
                <th className="p-3.5 border-b border-gray-200">Purpose &amp; Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              <tr className="bg-white">
                <td className="p-3.5 font-mono font-bold text-gray-900">
                  foodhub_access_token / zayka_auth
                </td>
                <td className="p-3.5">LocalStorage / Cookie</td>
                <td className="p-3.5">
                  Stores the cryptographically signed JWT access token for user authentication and
                  authorized API requests.
                </td>
              </tr>
              <tr className="bg-gray-50/60">
                <td className="p-3.5 font-mono font-bold text-gray-900">foodhub_refresh_token</td>
                <td className="p-3.5">LocalStorage / Cookie</td>
                <td className="p-3.5">
                  Enables secure token rotation so your session remains active without requiring
                  repeated logins.
                </td>
              </tr>
              <tr className="bg-white">
                <td className="p-3.5 font-mono font-bold text-gray-900">cart-storage</td>
                <td className="p-3.5">LocalStorage</td>
                <td className="p-3.5">
                  Preserves your selected restaurant, food items, variants, and quantities across
                  page navigation.
                </td>
              </tr>
              <tr className="bg-gray-50/60">
                <td className="p-3.5 font-mono font-bold text-gray-900">address-storage</td>
                <td className="p-3.5">LocalStorage</td>
                <td className="p-3.5">
                  Remembers your currently active selected delivery address for nearby restaurant
                  filtering.
                </td>
              </tr>
              <tr className="bg-white">
                <td className="p-3.5 font-mono font-bold text-gray-900">foodhub-theme</td>
                <td className="p-3.5">LocalStorage</td>
                <td className="p-3.5">Stores dark/light mode visual display preferences.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Absence of Third-Party Ad Trackers */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>3.</span> Zero Third-Party Advertising Trackers
        </h2>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-950 space-y-1.5">
          <p className="font-bold text-emerald-900">Privacy Assurance:</p>
          <p>
            Zayka Food does <strong>NOT</strong> deploy third-party advertising cookies, behavioural
            cross-site tracking scripts, Google Analytics trackers, or Meta / Facebook Pixel
            scripts. We do not monetize your browsing history or sell tracking data to third-party
            ad brokers.
          </p>
        </div>
      </section>

      {/* 4. Managing and Clearing Storage */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>4.</span> How You Can Control and Clear Cookies
        </h2>
        <p className="text-sm text-gray-700">You have full control over your browser storage:</p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
          <li>
            <strong>Logging Out:</strong> Clicking &quot;Log Out&quot; on the Platform clears your
            authentication tokens from local storage.
          </li>
          <li>
            <strong>Browser Settings:</strong> You can clear cookies and site data through your
            browser settings (Chrome, Safari, Firefox, Edge). Note that clearing essential site data
            will log you out and empty your active cart.
          </li>
        </ul>
      </section>

      {/* 5. Questions */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>5.</span> Contact Regarding Storage Policies
        </h2>
        <p className="text-sm text-gray-700">
          If you have technical or privacy questions regarding our cookie practices, please contact
          us at{' '}
          <a
            href="mailto:businesscity05@gmail.com"
            className="text-orange-600 font-bold hover:underline"
          >
            businesscity05@gmail.com
          </a>
          .
        </p>
      </section>
    </LegalPageLayout>
  );
}
