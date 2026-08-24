import React from 'react';
import { Metadata } from 'next';
import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy | Zayka Food',
  description: 'Official Privacy Policy of Zayka Food detailing how personal data, GPS location, and order information are collected, processed, and protected under Indian law.',
  alternates: {
    canonical: 'https://zaykafood.online/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="How Zayka Food collects, uses, shares, and protects your personal information across our marketplace platform in accordance with the Digital Personal Data Protection Act, 2023."
      lastUpdated="February 2026"
    >
      {/* 1. Introduction */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>1.</span> Introduction
        </h2>
        <p className="text-sm text-gray-700">
          Welcome to <strong>Zayka Food</strong> (accessible via{' '}
          <a href="https://zaykafood.online" className="text-orange-600 font-bold hover:underline">
            https://zaykafood.online
          </a>
          ). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains our practices regarding the collection, storage, processing, transfer, and disclosure of personal data when you access or use our customer web portal, merchant portals, courier interfaces, or related online services (collectively, the &quot;Platform&quot;).
        </p>
        <p className="text-sm text-gray-700">
          This Privacy Policy is formulated in accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, the <strong>Digital Personal Data Protection Rules, 2025</strong>, the <strong>Information Technology Act, 2000</strong>, the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>, and other applicable laws of the Republic of India.
        </p>
      </section>

      {/* 2. Who Operates Zayka Food */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>2.</span> Who Operates Zayka Food
        </h2>
        <p className="text-sm text-gray-700">
          The Zayka Food platform is owned and operated as an <strong>Individual / Sole Proprietorship</strong> business enterprise registered under the proprietor&apos;s trade name and Permanent Account Number (PAN) in the Union Territory of Jammu &amp; Kashmir, India.
        </p>
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-xs space-y-1.5 text-gray-700">
          <p><strong>Trade / Platform Name:</strong> Zayka Food</p>
          <p><strong>Legal Entity Structure:</strong> Individual / Sole Proprietorship (not a Private Limited Company)</p>
          <p><strong>Operating Address:</strong> Kehnusa, Bandipora, Jammu &amp; Kashmir, India - 193502</p>
          <p><strong>Official Contact Email:</strong> <a href="mailto:businesscity05@gmail.com" className="text-orange-600 font-bold hover:underline">businesscity05@gmail.com</a></p>
          <p><strong>Official Website:</strong> <a href="https://zaykafood.online" className="text-orange-600 font-bold hover:underline">https://zaykafood.online</a></p>
        </div>
      </section>

      {/* 3. Scope of this Policy */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>3.</span> Scope of this Policy
        </h2>
        <p className="text-sm text-gray-700">
          This policy applies to all Data Principals interacting with Zayka Food, including:
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li><strong>Customers / Consumers:</strong> Individuals browsing menus, adding items to cart, and placing delivery or pickup orders.</li>
          <li><strong>Merchant / Restaurant Partners:</strong> Independent hotels, restaurants, bakeries, and cloud kitchens registering to list food and beverage offerings.</li>
          <li><strong>Delivery Partners / Couriers:</strong> Independent delivery personnel registering to fulfill transit and delivery jobs.</li>
          <li><strong>Visitors:</strong> Any individual accessing or navigating public pages of our website.</li>
        </ul>
      </section>

      {/* 4. Information We Collect */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>4.</span> Information We Collect
        </h2>
        <p className="text-sm text-gray-700">
          We collect personal data directly from you when you interact with our platform, automatically through device sensors and browser sessions, and through operational interactions during order fulfillment.
        </p>

        <div className="space-y-4 pt-2">
          <div className="rounded-2xl border border-gray-100 p-4 bg-white shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-gray-900">4.1 Customer Information</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              When you register an account or place an order, we collect:
            </p>
            <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
              <li>Full Name and contact preferences</li>
              <li>Mobile Phone Number (verified via SMS / OTP protocols)</li>
              <li>Email address (optional or account-linked)</li>
              <li>Encrypted authentication credentials (passwords are stored as one-way Bcrypt hashes; we never store plain-text passwords)</li>
              <li>Saved delivery addresses, landmarks, locality tags, and postal codes</li>
              <li>Order history, selected menu items, customization notes, and dietary instructions</li>
              <li>Reviews, ratings, and customer support feedback</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-100 p-4 bg-white shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-gray-900">4.2 Restaurant Partner Information</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              When onboarding a merchant kitchen, we collect business and regulatory data:
            </p>
            <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
              <li>Restaurant trading name, branch name, and physical address</li>
              <li>Owner/manager contact details (name, email, phone number)</li>
              <li>Food Safety and Standards Authority of India (FSSAI) license/registration number and expiry</li>
              <li>Goods and Services Tax Identification Number (GSTIN) and Permanent Account Number (PAN) where applicable</li>
              <li>Bank account details (bank name, account number, IFSC code, account holder name) or UPI ID for settlement disbursement</li>
              <li>Menu catalog, item descriptions, pricing, preparation times, and store GPS coordinates</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-100 p-4 bg-white shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-gray-900">4.3 Delivery Partner Information</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              When onboarding a courier rider, we collect verification and operational data:
            </p>
            <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
              <li>Full legal name, contact phone number, and residential area</li>
              <li>Driving License (DL) number and Vehicle Registration (RC) details</li>
              <li>Vehicle category (e.g. Motorcycle, Scooter, EV)</li>
              <li>Bank account information or UPI ID for delivery fee payouts and tips</li>
              <li>Live duty GPS location during active delivery shifts</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Location and GPS Information */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>5.</span> Location and GPS Information
        </h2>
        <div className="rounded-2xl bg-orange-50/70 border border-orange-200/60 p-4 text-xs text-orange-900 leading-relaxed space-y-2">
          <p className="font-bold">How Zayka Food Uses Your Location:</p>
          <p>
            Zayka Food is a hyper-local marketplace. Location data is collected strictly to deliver core platform services:
          </p>
          <p className="font-mono text-[11px] bg-white/80 p-2.5 rounded-xl border border-orange-200">
            Device GPS / Browser Location → Latitude &amp; Longitude → Zayka Regional Locality Dataset → Nearby Restaurant Discovery → Store Delivery Radius Eligibility → Accurate MapmyIndia road Distance &amp; Fee Calculation
          </p>
        </div>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
          <li><strong>Customer Location:</strong> Collected <em>only with your explicit permission</em> via your device browser dialog when you search for nearby restaurants, add a delivery address, or proceed to checkout. <strong>Zayka Food does NOT continuously track customer location in the background when the website is closed or idle.</strong></li>
          <li><strong>Manual Location Search:</strong> If you decline GPS permissions, you may manually search and select verified localities, villages, and towns from our regional dataset (e.g. Kehnusa, Watlab, Aloosa, Bandipora, Sopore).</li>
          <li><strong>Courier Partner Tracking:</strong> Delivery partners transmit real-time GPS coordinates <em>only while on active duty</em> (&quot;ONLINE&quot; status) and during active order deliveries to facilitate live dispatch, ETA calculations, and pickup/drop-off navigation.</li>
          <li><strong>Control:</strong> You can enable, modify, or revoke browser location permissions at any time through your browser or device system settings.</li>
        </ul>
      </section>

      {/* 6. Payment Information */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>6.</span> Payment-Related Information
        </h2>
        <p className="text-sm text-gray-700">
          Zayka Food supports Cash on Delivery (COD) and Online Electronic Payments (UPI, Credit/Debit Cards, Net Banking).
        </p>
        <p className="text-sm text-gray-700">
          For online payments, transactions are processed directly by our authorized, Reserve Bank of India (RBI) compliant payment gateway partner (e.g. <strong>Razorpay</strong>). <strong>Zayka Food does NOT store your raw debit card numbers, credit card numbers, CVV/CVC codes, or banking net-banking passwords on our servers.</strong> All online card payments are handled under PCI-DSS Level 1 compliant tokenized gateway environments.
        </p>
      </section>

      {/* 7. Device and Technical Information */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>7.</span> Device and Technical Information
        </h2>
        <p className="text-sm text-gray-700">
          When you access our platform, our servers automatically log technical parameters necessary for operational reliability, security, and rate-limiting:
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Internet Protocol (IP) address and rough network locality</li>
          <li>Browser type, version, and device operating system</li>
          <li>Date and timestamp of API requests</li>
          <li>Session identifiers, error logs, and performance metrics</li>
        </ul>
      </section>

      {/* 8. Cookies and Storage */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>8.</span> Cookies and Browser Storage
        </h2>
        <p className="text-sm text-gray-700">
          We use strictly necessary browser storage (such as <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">localStorage</code> and session tokens) for authentication session persistence, cart preservation across page reloads, and user theme preferences.
        </p>
        <p className="text-sm text-gray-700">
          <strong>We do not use third-party advertising cookies, behavioral ad retargeting networks, Google Analytics, or Meta Pixel trackers.</strong> For complete details, please read our dedicated <a href="/cookie-policy" className="text-orange-600 font-bold hover:underline">Cookie Policy</a>.
        </p>
      </section>

      {/* 9. How We Use Your Information */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>9.</span> How We Use Your Information
        </h2>
        <p className="text-sm text-gray-700">
          We process personal data only for lawful, legitimate, and explicit operational purposes:
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
          <li><strong>Order Processing &amp; Fulfillment:</strong> Transmitting your order, items, and preparation instructions to the selected restaurant.</li>
          <li><strong>Delivery Coordination:</strong> Assigning an available courier, calculating distance fees, routing pickup and delivery, and verifying handovers via OTP.</li>
          <li><strong>Payment Processing:</strong> Reconciling order payments, processing refunds for cancelled or rejected orders, and calculating merchant settlements.</li>
          <li><strong>Communication &amp; Notifications:</strong> Sending transactional order updates, preparation status, courier transit alerts, and OTP codes.</li>
          <li><strong>Security &amp; Fraud Prevention:</strong> Preventing duplicate registrations, unauthorized logins, payment fraud, and unauthorized role access.</li>
          <li><strong>Customer Support &amp; Grievances:</strong> Investigating failed orders, missing items, payment discrepancies, and resolving disputes.</li>
          <li><strong>Legal &amp; Statutory Compliance:</strong> Maintaining accounting ledgers, tax records, and responding to lawful requests from law enforcement authorities.</li>
        </ul>
      </section>

      {/* 10. Information Sharing and Disclosure */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>10.</span> Information Sharing and Disclosure
        </h2>
        <p className="text-sm text-gray-700">
          We do not sell, rent, or trade your personal data to third parties for advertising or commercial marketing. Data is shared strictly on a need-to-know basis with the following entities:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/50 space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">1. Selected Restaurant</h4>
            <p className="text-xs text-gray-600">
              Receives customer first name, ordered menu items, variants, customization notes, and pickup handover verification codes.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/50 space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">2. Assigned Delivery Courier</h4>
            <p className="text-xs text-gray-600">
              Receives customer delivery address, contact number for delivery coordination, drop-off location coordinates, and delivery verification OTP.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/50 space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">3. Payment Service Providers</h4>
            <p className="text-xs text-gray-600">
              Authorized payment gateways (e.g. Razorpay) receive order ID, billing amount, and transaction tokens for processing payments and refunds.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/50 space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">4. Legal &amp; Law Enforcement</h4>
            <p className="text-xs text-gray-600">
              We may disclose information where required by law, court summons, judicial order, or lawful government mandate under Indian jurisdiction.
            </p>
          </div>
        </div>
      </section>

      {/* 11. Data Retention & Deletion */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>11.</span> Data Retention and Deletion
        </h2>
        <p className="text-sm text-gray-700">
          We retain personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is mandated by Indian tax, consumer protection, or accounting regulations.
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li><strong>Account Information:</strong> Retained while your account remains active. You may request deletion of your account at any time.</li>
          <li><strong>Order &amp; Transaction Records:</strong> Retained for statutory periods (minimum 5 to 7 years) to comply with Indian Goods and Services Tax (GST) laws and financial audit standards.</li>
          <li><strong>Ephemeral Location Logs:</strong> Real-time courier GPS coordinates are purged or aggregated periodically after order delivery completion.</li>
        </ul>
      </section>

      {/* 12. Your Rights Under Indian Law (DPDP Act, 2023) */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>12.</span> Your Rights under the DPDP Act, 2023
        </h2>
        <p className="text-sm text-gray-700">
          As a Data Principal under Indian law, you have specific statutory rights regarding your personal data:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700 pt-1">
          <div className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50">
            <strong className="text-gray-900 block mb-1">Right to Access Information</strong>
            Request a summary of personal data being processed and the processing activities undertaken.
          </div>
          <div className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50">
            <strong className="text-gray-900 block mb-1">Right to Correction &amp; Erasure</strong>
            Request correction of inaccurate or incomplete personal data, or erasure of data no longer necessary.
          </div>
          <div className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50">
            <strong className="text-gray-900 block mb-1">Right to Withdraw Consent</strong>
            Withdraw consent previously granted for data processing without affecting prior lawful processing.
          </div>
          <div className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50">
            <strong className="text-gray-900 block mb-1">Right of Grievance Redressal</strong>
            Access a prompt and transparent grievance redressal mechanism for any privacy concerns.
          </div>
        </div>
        <p className="text-xs text-gray-600 pt-1">
          To exercise any of these rights, please email our Grievance Team at <a href="mailto:businesscity05@gmail.com" className="text-orange-600 font-bold hover:underline">businesscity05@gmail.com</a>.
        </p>
      </section>

      {/* 13. Data Security & Incident Management */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>13.</span> Data Security &amp; Incident Management
        </h2>
        <p className="text-sm text-gray-700">
          We implement technical and organizational measures designed to protect your data, including HTTPS / TLS 256-bit encryption in transit, strict Role-Based Access Control (RBAC), one-way password hashing (Bcrypt), and secure tokenized API communications.
        </p>
        <p className="text-sm text-gray-700">
          In the unlikely event of a confirmed personal data breach affecting data principals, Zayka Food will promptly notify the <strong>Data Protection Board of India</strong> and affected users in compliance with the DPDP Act, 2023 and applicable rules.
        </p>
      </section>

      {/* 14. Children's Data */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>14.</span> Protection of Children&apos;s Data
        </h2>
        <p className="text-sm text-gray-700">
          Zayka Food is not intended for unsupervised use by minors under the age of 18. We do not knowingly collect or process personal data belonging to children without verifiable parental or guardian consent. If we discover that personal data of a minor has been submitted without appropriate consent, we will take immediate steps to delete such information.
        </p>
      </section>

      {/* 15. Policy Updates */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>15.</span> Updates to this Policy
        </h2>
        <p className="text-sm text-gray-700">
          We may update this Privacy Policy periodically to reflect technological changes, new platform features, or evolving statutory requirements in India. When revisions are made, the updated document will be published on this page with an updated &quot;Effective Date&quot;. Your continued use of the platform following the posting of changes constitutes your acknowledgment of the revised terms.
        </p>
      </section>

      {/* 16. Grievance Redressal & Contact Information */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>16.</span> Grievance Redressal &amp; Contact Information
        </h2>
        <p className="text-sm text-gray-700">
          In compliance with the DPDP Act 2023, Information Technology Act 2000, and Consumer Protection (E-Commerce) Rules 2020, our designated grievance contact is:
        </p>
        <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 text-xs space-y-1.5 text-gray-800">
          <p><strong>Designation:</strong> Zayka Food – Grievance Team</p>
          <p><strong>Operating Business:</strong> Zayka Food (Individual / Sole Proprietorship)</p>
          <p><strong>Official Email:</strong> <a href="mailto:businesscity05@gmail.com" className="text-orange-600 font-bold hover:underline">businesscity05@gmail.com</a></p>
          <p><strong>Address:</strong> Kehnusa, Bandipora, Jammu &amp; Kashmir, India - 193502</p>
          <p><strong>Working Hours:</strong> Monday to Saturday, 9:00 AM – 6:00 PM IST</p>
        </div>
      </section>
    </LegalPageLayout>
  );
}
