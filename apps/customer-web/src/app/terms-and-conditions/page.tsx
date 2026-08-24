import React from 'react';
import { Metadata } from 'next';
import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Zayka Food',
  description: 'Official Terms & Conditions governing use of the Zayka Food marketplace platform by customers, restaurants, and delivery partners under Indian law.',
  alternates: {
    canonical: 'https://zaykafood.online/terms-and-conditions',
  },
};

export default function TermsAndConditionsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      subtitle="The contractual terms and marketplace operating guidelines governing access to Zayka Food by customers, merchant restaurants, and delivery partners."
      lastUpdated="February 2026"
    >
      {/* 1. Introduction & Acceptance */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>1.</span> Introduction &amp; Acceptance of Terms
        </h2>
        <p className="text-sm text-gray-700">
          These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding electronic agreement between you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and <strong>Zayka Food</strong> (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operating as an Individual / Sole Proprietorship from Kehnusa, Bandipora, Jammu &amp; Kashmir, India.
        </p>
        <p className="text-sm text-gray-700">
          By accessing, browsing, registering on, or placing orders through{' '}
          <a href="https://zaykafood.online" className="text-orange-600 font-bold hover:underline">
            https://zaykafood.online
          </a>
          , you acknowledge that you have read, understood, and agree to be bound by these Terms and our linked policies. If you do not agree to these Terms, you must immediately refrain from accessing or using the Platform.
        </p>
      </section>

      {/* 2. Marketplace Intermediary Model */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>2.</span> Tripartite Marketplace Intermediary Model
        </h2>
        <p className="text-sm text-gray-700">
          Zayka Food operates as a <strong>hyper-local, multi-vendor electronic marketplace intermediary</strong> as defined under Section 2(1)(w) of the Information Technology Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 space-y-1">
            <span className="font-bold text-gray-900 block">1. Customer</span>
            <p className="text-gray-600">Discovers local menus, places food orders, and makes payments.</p>
          </div>
          <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 space-y-1">
            <span className="font-bold text-gray-900 block">2. Restaurant Partner</span>
            <p className="text-gray-600">Independently prepares food, manages pricing, packaging, and FSSAI compliance.</p>
          </div>
          <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 space-y-1">
            <span className="font-bold text-gray-900 block">3. Delivery Courier</span>
            <p className="text-gray-600">Independently provides logistics, transit, and customer doorstep handover.</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 pt-1">
          <strong>Important Clarification:</strong> Zayka Food does not own, prepare, cook, or retail food items, nor do we operate commercial kitchen facilities. All food items listed on the Platform are prepared by independent, third-party licensed merchant restaurants.
        </p>
      </section>

      {/* 3. User Eligibility & Account Responsibilities */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>3.</span> Eligibility &amp; Account Security
        </h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
          <li><strong>Age:</strong> You must be at least 18 years of age and competent to enter into a legally binding contract under the Indian Contract Act, 1872.</li>
          <li><strong>Account Information:</strong> You agree to provide accurate, current, and complete information during registration, including your real name, valid 10-digit Indian mobile number, and accurate delivery addresses.</li>
          <li><strong>Credential Confidentiality:</strong> You are solely responsible for maintaining the confidentiality of your account credentials and one-time passwords (OTP). Any activity conducted through your authenticated account shall be deemed your responsibility.</li>
          <li><strong>Prohibited Misuse:</strong> You agree not to create duplicate accounts for promotional manipulation, impersonate any person, or use automated scrapers or bots on the Platform.</li>
        </ul>
      </section>

      {/* 4. Restaurant Partner Responsibilities */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>4.</span> Restaurant Partner Responsibilities &amp; FSSAI Standards
        </h2>
        <p className="text-sm text-gray-700">
          All onboarded merchant restaurants, hotels, and cloud kitchens agree to strictly abide by statutory operational obligations:
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
          <li><strong>FSSAI Compliance:</strong> Merchants must possess and maintain a valid license or registration under the Food Safety and Standards Act, 2006 (FSSA) and display their FSSAI license number on their merchant listing.</li>
          <li><strong>Food Hygiene &amp; Packaging:</strong> The restaurant is solely responsible for food hygiene, fresh ingredients, allergen declarations, dietary flags (Veg/Non-Veg), and tamper-evident packaging.</li>
          <li><strong>Menu &amp; Price Integrity:</strong> Merchants must ensure that listed prices, item descriptions, and availability are accurate and up to date.</li>
          <li><strong>Order Handover Verification:</strong> Restaurants must verify the 4-digit pickup code or signed QR token from the assigned delivery courier before handing over food parcels.</li>
        </ul>
      </section>

      {/* 5. Delivery Partner Responsibilities */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>5.</span> Delivery Partner Terms &amp; Courier Conduct
        </h2>
        <p className="text-sm text-gray-700">
          Independent courier partners registering on Zayka Food agree to:
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
          <li>Hold a valid Driving License (DL) and vehicle registration (RC) compliant with the Motor Vehicles Act, 1988.</li>
          <li>Handle food packages with care in clean, insulated delivery bags without tampering with merchant seals.</li>
          <li>Verify the 6-digit delivery confirmation OTP with the customer prior to completing the handover in the courier portal.</li>
          <li>Maintain professional, respectful conduct during transit and customer interactions.</li>
        </ul>
      </section>

      {/* 6. Pricing, Taxes & Quotes */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>6.</span> Pricing, Taxes &amp; Dynamic Order Quotes
        </h2>
        <p className="text-sm text-gray-700">
          All order prices on Zayka Food are computed authoritatively by our server-side quote engine:
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
          <li><strong>Menu Item Prices:</strong> Set by the respective merchant restaurants and displayed in Indian Rupees (₹/INR).</li>
          <li><strong>Delivery Distance Fees:</strong> Calculated dynamically based on server-side MapmyIndia road distance from the restaurant to your verified delivery address.</li>
          <li><strong>Platform Convenience Fee:</strong> A nominal platform technology fee (e.g. ₹3) may apply to support secure infrastructure and customer support operations.</li>
          <li><strong>Statutory Goods and Services Tax (GST):</strong> Calculated in accordance with applicable Indian tax rules. CGST and SGST are itemized where statutory thresholds apply.</li>
          <li><strong>Price Immutability:</strong> Once an order is confirmed, an immutable pricing snapshot is stored in the database. Client-side price modifications are strictly blocked.</li>
        </ul>
      </section>

      {/* 7. Order Placement & State Machine */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>7.</span> Order Placement, Acceptance &amp; State Transitions
        </h2>
        <p className="text-sm text-gray-700">
          Orders placed on Zayka Food progress through a strict, auditable backend state machine:
        </p>
        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-mono space-y-1 text-gray-800">
          PENDING → ACCEPTED → PREPARING → READY_FOR_PICKUP → DRIVER_ASSIGNED → ARRIVED_AT_RESTAURANT → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED
        </div>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5 pt-1">
          <li><strong>Merchant Acceptance:</strong> Placing an order represents an offer to purchase. A binding contract is formed only when the restaurant formally accepts the order (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded">ACCEPTED</code> status).</li>
          <li><strong>Kitchen Rejections:</strong> A restaurant may reject an order due to kitchen capacity constraints, item stockouts, or operational closure, triggering an immediate 100% refund.</li>
          <li><strong>Delivery Radius Limits:</strong> Orders can only be delivered within the designated delivery radius configured by each restaurant. Addresses outside the radius will not be accepted at checkout.</li>
        </ul>
      </section>

      {/* 8. Cancellation & Refunds Reference */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>8.</span> Cancellation &amp; Refunds
        </h2>
        <p className="text-sm text-gray-700">
          Order cancellations, refunds, damaged items, and payment reconciliation are governed strictly by our separate{' '}
          <a href="/refund-policy" className="text-orange-600 font-bold hover:underline">
            Refund &amp; Cancellation Policy
          </a>
          , which is incorporated into these Terms by reference.
        </p>
      </section>

      {/* 9. Prohibited Activities */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>9.</span> Prohibited Activities
        </h2>
        <p className="text-sm text-gray-700">
          Users of the platform shall not:
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Post unlawful, abusive, defamatory, obscene, or fraudulent content.</li>
          <li>Attempt to reverse-engineer, decompile, or tamper with the platform APIs or WebSocket servers.</li>
          <li>Use false addresses, spoof GPS coordinates, or exploit promo codes in bad faith.</li>
          <li>Harass, intimidate, or abuse restaurant staff, delivery couriers, or platform support agents.</li>
        </ul>
      </section>

      {/* 10. Limitation of Liability */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>10.</span> Limitation of Liability
        </h2>
        <p className="text-sm text-gray-700">
          To the maximum extent permitted by applicable Indian law:
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
          <li>Zayka Food acts as an electronic intermediary connecting users with independent sellers and couriers. We are not liable for direct quality defects, preparation delays, or allergen issues caused solely by independent merchant restaurants.</li>
          <li>Nothing in these Terms excludes or limits any statutory consumer rights that cannot be lawfully excluded under the <strong>Consumer Protection Act, 2019</strong>.</li>
          <li>In any event, our total aggregate liability arising out of or in connection with any specific order shall be limited to the total amount paid by the customer for that order.</li>
        </ul>
      </section>

      {/* 11. Force Majeure */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>11.</span> Force Majeure
        </h2>
        <p className="text-sm text-gray-700">
          Neither Zayka Food, merchant restaurants, nor delivery partners shall be held liable for failure or delay in fulfilling orders due to events beyond reasonable control, including acts of God, severe winter snowfall, road blockades, floods, curfews, internet disruptions, civil unrest, or statutory government restrictions.
        </p>
      </section>

      {/* 12. Governing Law & Jurisdiction */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>12.</span> Governing Law &amp; Dispute Resolution
        </h2>
        <p className="text-sm text-gray-700">
          These Terms and all disputes arising hereunder shall be governed by and construed in accordance with the substantive laws of the Republic of India. The courts of competent jurisdiction in <strong>Bandipora / Jammu &amp; Kashmir</strong> shall have exclusive jurisdiction over any legal proceedings arising out of these Terms.
        </p>
      </section>

      {/* 13. Grievance Redressal */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>13.</span> Grievance Redressal &amp; Contact
        </h2>
        <p className="text-sm text-gray-700">
          For any consumer grievances, legal inquiries, or dispute escalation, please refer to our{' '}
          <a href="/grievance-redressal" className="text-orange-600 font-bold hover:underline">
            Grievance Redressal Mechanism
          </a>{' '}
          or contact us at <a href="mailto:businesscity05@gmail.com" className="text-orange-600 font-bold hover:underline">businesscity05@gmail.com</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
