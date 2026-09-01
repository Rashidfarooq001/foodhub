import React from 'react';
import { Metadata } from 'next';
import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Delivery Policy | Zayka Food',
  description:
    'Official Delivery Policy of Zayka Food explaining hyper-local delivery zones, radius validation, estimated times, and OTP verification in Bandipora and Jammu & Kashmir.',
  alternates: {
    canonical: 'https://zaykafood.online/delivery-policy',
  },
};

export default function DeliveryPolicyPage() {
  return (
    <LegalPageLayout
      title="Delivery Policy"
      subtitle="How hyper-local delivery works on Zayka Food, including delivery zones, distance calculation, time estimates, and secure OTP handovers."
      lastUpdated="February 2026"
    >
      {/* 1. How Delivery Works */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>1.</span> How Hyper-Local Delivery Works
        </h2>
        <p className="text-sm text-gray-700">
          Zayka Food connects customers with local restaurants through an integrated, hyper-local
          logistics network. Delivery jobs are dispatched in real-time to active, nearby courier
          partners based on geographical proximity, vehicle type, and kitchen preparation readiness.
        </p>
      </section>

      {/* 2. Service Areas & Delivery Radius */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>2.</span> Service Areas &amp; Delivery Radius
        </h2>
        <p className="text-sm text-gray-700">
          Zayka Food currently operates across key localities, towns, and villages in{' '}
          <strong>Bandipora and surrounding districts of Jammu &amp; Kashmir</strong> (including
          Kehnusa, Watlab, Aloosa, Sopore, Bandipora Town, and adjacent areas).
        </p>
        <div className="rounded-2xl bg-orange-50/80 border border-orange-200/80 p-4 text-xs text-orange-950 space-y-1.5">
          <p className="font-bold">Delivery Radius Rules:</p>
          <p>
            Delivery availability is not universal across all pin codes. Each merchant restaurant
            configures an operational delivery radius (typically 5 km to 15 km). Delivery
            eligibility is validated dynamically at checkout based on the server-calculated distance
            between the restaurant&apos;s GPS coordinates and your delivery address.
          </p>
        </div>
      </section>

      {/* 3. Distance & Fee Calculation */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>3.</span> Distance Calculation &amp; Delivery Charges
        </h2>
        <p className="text-sm text-gray-700">
          Delivery charges are calculated transparently by our backend pricing engine based on the
          direct radial MapmyIndia road distance from the restaurant to your verified delivery
          point:
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
          <li>
            <strong>Base Delivery Fee:</strong> Tiered starting from a base rate (e.g. ₹15 for local
            short-distance deliveries).
          </li>
          <li>
            <strong>Per-Kilometer Distance Tiers:</strong> Incremental delivery charges are added
            for longer transit distances to fairly compensate courier partners.
          </li>
          <li>
            <strong>Rider Tips:</strong> Customers may optionally add a 100% pass-through tip for
            the delivery courier at checkout.
          </li>
        </ul>
      </section>

      {/* 4. Estimated Delivery Times (ETA) */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>4.</span> Estimated Delivery Times (ETA)
        </h2>
        <p className="text-sm text-gray-700">
          Estimated delivery times displayed on restaurant cards and checkout screens are computed
          dynamically as:
        </p>
        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 font-mono text-xs text-gray-800 text-center">
          Total ETA = Kitchen Preparation Time (15–30 mins) + Courier Travel Time (based on road
          distance &amp; weather)
        </div>
        <p className="text-xs text-gray-600 pt-1">
          While our merchant and courier partners aim for punctuality, ETAs are estimates. Actual
          transit times may vary due to traffic congestion, inclement weather (heavy snowfall/rain),
          high kitchen demand during peak lunch/dinner hours, or road diversions.
        </p>
      </section>

      {/* 5. Secure OTP Delivery Handover */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>5.</span> Two-Step OTP Verification &amp; Safe Handover
        </h2>
        <p className="text-sm text-gray-700">
          To ensure strict security and prevent parcel mix-ups, Zayka Food enforces two-factor
          digital verification:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 space-y-1.5">
            <strong className="text-gray-900 block">Step 1: Restaurant Pickup OTP</strong>
            <p className="text-gray-600">
              The restaurant verifies the courier&apos;s 4-digit pickup code or signed QR token
              before releasing food parcels from the kitchen.
            </p>
          </div>
          <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 space-y-1.5">
            <strong className="text-gray-900 block">Step 2: Customer Delivery OTP</strong>
            <p className="text-gray-600">
              Upon arrival at your doorstep, you must share the 6-digit delivery OTP displayed on
              your order tracking screen with the courier to complete handover.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Customer Unavailability & Failed Deliveries */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>6.</span> Customer Unavailability &amp; Failed Deliveries
        </h2>
        <p className="text-sm text-gray-700">
          When the courier reaches your designated delivery address:
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
          <li>The courier will attempt to contact you via your registered phone number.</li>
          <li>
            Couriers will wait for a maximum of <strong>10 minutes</strong> at the destination
            address.
          </li>
          <li>
            If you are unreachable, refuse handover, or have provided an incorrect/incomplete
            address, the order will be marked as failed. Because prepared food items cannot be
            restocked or returned, failed deliveries resulting from customer unavailability are{' '}
            <strong>not eligible for refunds</strong>.
          </li>
        </ul>
      </section>

      {/* 7. Inclement Weather & Regional Disruptions */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>7.</span> Weather Disruptions &amp; Force Majeure
        </h2>
        <p className="text-sm text-gray-700">
          In the event of severe weather conditions in Jammu &amp; Kashmir (e.g. heavy snowfall,
          sub-zero road icing, flash floods), or local security curfews and roadblocks, delivery
          services may be temporarily suspended or delayed for courier safety. Affected customers
          will be notified via the app.
        </p>
      </section>

      {/* 8. Delivery Support */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>8.</span> Delivery Inquiries &amp; Support
        </h2>
        <p className="text-sm text-gray-700">
          For live order tracking issues or delivery queries, please reach out to{' '}
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
