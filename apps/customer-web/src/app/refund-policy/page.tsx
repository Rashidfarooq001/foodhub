import React from 'react';
import { Metadata } from 'next';
import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | Zayka Food',
  description:
    'Official Refund & Cancellation Policy of Zayka Food explaining customer cancellation rights, merchant rejections, damaged items, and refund processing timelines.',
  alternates: {
    canonical: 'https://zaykafood.online/refund-policy',
  },
};

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Refund & Cancellation Policy"
      subtitle="Clear, transparent rules governing order cancellations, merchant rejections, food quality grievances, and refund timelines on Zayka Food."
      lastUpdated="February 2026"
    >
      {/* 1. Policy Overview */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>1.</span> Overview
        </h2>
        <p className="text-sm text-gray-700">
          At <strong>Zayka Food</strong>, we strive to deliver delicious meals from your favorite
          local kitchens with speed and reliability. Because food and beverage items are perishable,
          prepared-to-order commodities, our cancellation and refund policies are structured to be
          fair to customers while protecting merchant kitchens and delivery personnel from
          unnecessary waste.
        </p>
        <p className="text-sm text-gray-700">
          This policy complies with the <strong>Consumer Protection Act, 2019</strong> and the{' '}
          <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>.
        </p>
      </section>

      {/* 2. Customer Order Cancellation */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>2.</span> Customer Order Cancellation Rights
        </h2>
        <p className="text-sm text-gray-700">
          Your ability to cancel an order and receive a refund depends on the order&apos;s real-time
          state in our backend system:
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left border border-gray-200 rounded-2xl overflow-hidden">
            <thead className="bg-gray-100 text-gray-900 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 border-b border-gray-200">Order State</th>
                <th className="p-3.5 border-b border-gray-200">Cancellation Eligibility</th>
                <th className="p-3.5 border-b border-gray-200">Refund Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              <tr className="bg-white">
                <td className="p-3.5 font-bold text-gray-900">
                  PENDING (Before Restaurant Acceptance)
                </td>
                <td className="p-3.5 text-emerald-700 font-bold">✓ Full Cancellation Allowed</td>
                <td className="p-3.5 font-bold text-emerald-600">100% Refund</td>
              </tr>
              <tr className="bg-gray-50/60">
                <td className="p-3.5 font-bold text-gray-900">ACCEPTED / PREPARING</td>
                <td className="p-3.5 text-amber-800">
                  Kitchen has commenced preparation of perishable ingredients
                </td>
                <td className="p-3.5 text-amber-700 font-medium">
                  Cancellation fee up to 100% of food subtotal may apply
                </td>
              </tr>
              <tr className="bg-white">
                <td className="p-3.5 font-bold text-gray-900">
                  READY_FOR_PICKUP / DRIVER_ASSIGNED
                </td>
                <td className="p-3.5 text-rose-700">
                  Food is prepared and driver has been dispatched
                </td>
                <td className="p-3.5 text-rose-700 font-bold">No Refund (100% cancellation fee)</td>
              </tr>
              <tr className="bg-gray-50/60">
                <td className="p-3.5 font-bold text-gray-900">PICKED_UP / OUT_FOR_DELIVERY</td>
                <td className="p-3.5 text-rose-700">
                  Courier is actively in transit to delivery address
                </td>
                <td className="p-3.5 text-rose-700 font-bold">No Refund (100% cancellation fee)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Restaurant Rejection or Cancellation */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>3.</span> Restaurant Rejection or Inability to Fulfill
        </h2>
        <p className="text-sm text-gray-700">
          If a merchant restaurant is unable to accept or fulfill your order due to item
          unavailability, kitchen closure, excessive kitchen queue, or technical faults, the order
          will be marked cancelled immediately by the system, and a{' '}
          <strong>100% full refund</strong> (including food subtotal, delivery fee, and platform
          fee) will be initiated automatically.
        </p>
      </section>

      {/* 4. Missing, Damaged or Incorrect Items */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>4.</span> Damaged Orders, Missing Items &amp; Quality Issues
        </h2>
        <p className="text-sm text-gray-700">
          If your order arrives with missing items, damaged packaging, or incorrect items, you are
          entitled to redressal:
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
          <li>
            <strong>Report Timeline:</strong> Issues must be reported to Zayka Food support within{' '}
            <strong>2 hours</strong> of delivery completion.
          </li>
          <li>
            <strong>Required Evidence:</strong> Please share your{' '}
            <strong>Order Number (e.g. FH-XXXXXX)</strong> along with clear photographic evidence of
            the damaged parcel, packaging seal, and invoice receipt to{' '}
            <a
              href="mailto:businesscity05@gmail.com"
              className="text-orange-600 font-bold hover:underline"
            >
              businesscity05@gmail.com
            </a>
            .
          </li>
          <li>
            <strong>Redressal Options:</strong> Upon verification with the restaurant and courier
            partner, we will issue a pro-rata refund for missing/damaged items, or a full refund if
            the entire meal is rendered inedible.
          </li>
        </ul>
      </section>

      {/* 5. Payment Failures & Duplicate Debits */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>5.</span> Payment Failures &amp; Duplicate Debits
        </h2>
        <p className="text-sm text-gray-700">
          If an amount is debited from your bank account or UPI app but the order fails to generate
          on the Platform (payment gateway drop-off):
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>
            The payment gateway and banking network typically auto-reconcile and reverse the
            transaction within 24 to 48 hours.
          </li>
          <li>
            If the debited amount is not refunded within 3 business days, please share your payment
            gateway transaction reference ID (e.g. Razorpay Payment ID) to our support team for
            expedited bank reconciliation.
          </li>
        </ul>
      </section>

      {/* 6. Refund Processing Timelines */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>6.</span> Refund Processing Timelines &amp; Methods
        </h2>
        <p className="text-sm text-gray-700">Once an approved refund is initiated by Zayka Food:</p>
        <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-4 text-xs text-amber-950 space-y-2">
          <p className="font-bold">Statutory Timeline Disclosure:</p>
          <p>
            Refund processing time depends on the original payment method, the payment service
            provider (e.g. Razorpay), the acquiring bank, and standard interbank settlement clearing
            cycles.
          </p>
        </div>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5 pt-1">
          <li>
            <strong>UPI Payments:</strong> Typically credited within 24 to 48 banking hours.
          </li>
          <li>
            <strong>Credit / Debit Cards &amp; Net Banking:</strong> Typically reflected in bank
            statements within 3 to 7 business days depending on your issuing bank.
          </li>
          <li>
            <strong>Cash on Delivery (COD) Refunds:</strong> If an approved refund is due for a COD
            order (e.g. verified missing item after payment), the refund will be transferred
            directly to your bank account or UPI ID upon verification.
          </li>
        </ul>
      </section>

      {/* 7. Fraudulent Claims */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>7.</span> Fraudulent or Abusive Refund Claims
        </h2>
        <p className="text-sm text-gray-700">
          Zayka Food utilizes delivery OTP confirmations and courier audit logs to investigate all
          claims. Users found repeatedly submitting false claims, refusing verified deliveries after
          courier arrival, or engaging in promotional chargeback abuse may have their accounts
          suspended and be subjected to recovery of delivery costs.
        </p>
      </section>

      {/* 8. Contact for Refunds */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>8.</span> Contact Support &amp; Dispute Escalation
        </h2>
        <p className="text-sm text-gray-700">
          For any refund-related assistance, please email our support desk at{' '}
          <a
            href="mailto:businesscity05@gmail.com"
            className="text-orange-600 font-bold hover:underline"
          >
            businesscity05@gmail.com
          </a>{' '}
          with your Order ID and contact details.
        </p>
      </section>
    </LegalPageLayout>
  );
}
