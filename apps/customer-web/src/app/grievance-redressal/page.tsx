import React from 'react';
import { Metadata } from 'next';
import { LegalPageLayout } from '../../components/legal/LegalPageLayout';
import { ShieldCheck, Mail, MapPin, Clock, FileText, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Grievance Redressal | Zayka Food',
  description: 'Official Grievance Redressal Mechanism of Zayka Food pursuant to Consumer Protection (E-Commerce) Rules, 2020 and IT Rules, 2021.',
  alternates: {
    canonical: 'https://zaykafood.online/grievance-redressal',
  },
};

export default function GrievanceRedressalPage() {
  return (
    <LegalPageLayout
      title="Grievance Redressal Mechanism"
      subtitle="Statutory grievance redressal framework pursuant to the Consumer Protection (E-Commerce) Rules, 2020 and Information Technology Act, 2000."
      lastUpdated="February 2026"
    >
      {/* 1. Legal Mandate */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>1.</span> Statutory Framework
        </h2>
        <p className="text-sm text-gray-700">
          In accordance with Rule 5(9) of the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, and the <strong>Digital Personal Data Protection Act, 2023</strong>, Zayka Food has established a dedicated, transparent mechanism to receive and resolve consumer complaints and grievances promptly.
        </p>
      </section>

      {/* 2. Designated Grievance Officer Details */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>2.</span> Designated Grievance Officer &amp; Entity Information
        </h2>
        <p className="text-sm text-gray-700">
          Consumers, merchants, and delivery partners may submit complaints and grievance representations directly to our designated Grievance Team:
        </p>

        <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Designated Department</span>
              <p className="text-sm font-bold text-gray-900">Zayka Food – Grievance Team</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Legal Entity Structure</span>
              <p className="text-sm font-bold text-gray-900">Individual / Sole Proprietorship</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Official Grievance Email</span>
              <p className="text-sm font-bold text-orange-600">
                <a href="mailto:businesscity05@gmail.com" className="hover:underline">businesscity05@gmail.com</a>
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Operating Hours</span>
              <p className="text-sm font-bold text-gray-900">Monday – Saturday: 9:00 AM to 6:00 PM IST</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Postal &amp; Operational Address</span>
            <p className="text-xs font-bold text-gray-800">
              Kehnusa, Bandipora, Jammu &amp; Kashmir, India - 193502
            </p>
          </div>
        </div>
      </section>

      {/* 3. How to Submit a Grievance */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>3.</span> How to Submit a Grievance
        </h2>
        <p className="text-sm text-gray-700">
          To ensure speedy and accurate resolution, please email <a href="mailto:businesscity05@gmail.com" className="text-orange-600 font-bold hover:underline">businesscity05@gmail.com</a> with the subject line <strong>&quot;GRIEVANCE: [Order Number / Issue Type]&quot;</strong> and include the following details:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3.5 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-1">
            <strong className="text-gray-900 block">1. Identification</strong>
            <p className="text-gray-600">Full name and registered mobile phone number associated with your Zayka Food account.</p>
          </div>
          <div className="p-3.5 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-1">
            <strong className="text-gray-900 block">2. Transaction Details</strong>
            <p className="text-gray-600">Order ID (e.g. FH-XXXXXX), date, restaurant name, and payment transaction reference ID.</p>
          </div>
          <div className="p-3.5 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-1">
            <strong className="text-gray-900 block">3. Nature of Complaint</strong>
            <p className="text-gray-600">Detailed description of the issue (e.g. food quality, missing item, payment discrepancy, delivery delay).</p>
          </div>
          <div className="p-3.5 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-1">
            <strong className="text-gray-900 block">4. Supporting Evidence</strong>
            <p className="text-gray-600">Photographs of the received parcel, packaging seal, bill receipt, or bank deduction screenshot.</p>
          </div>
        </div>
      </section>

      {/* 4. Grievance Handling Timelines (SLA) */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>4.</span> Resolution Timelines (Statutory SLA)
        </h2>
        <p className="text-sm text-gray-700">
          In strict compliance with statutory standards:
        </p>

        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-50/60 border border-orange-100 text-xs">
            <Clock className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-orange-950 block font-black">Acknowledgement within 48 Hours</strong>
              <p className="text-orange-900 mt-0.5">
                We will acknowledge the receipt of your grievance complaint within <strong>48 hours</strong> and issue a unique Grievance Ticket Number for tracking.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-950 block font-black">Redressal within 15 to 30 Days</strong>
              <p className="text-emerald-900 mt-0.5">
                Your grievance will be thoroughly investigated with the involved restaurant or courier partner and resolved within <strong>15 to 30 business days</strong> from the date of receipt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Escalation Matrix */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span>5.</span> Escalation Matrix
        </h2>
        <p className="text-sm text-gray-700">
          If your grievance is not resolved to your satisfaction within the stipulated statutory period, you may escalate the matter by replying to your ticket email with &quot;ESCALATION&quot; in the subject line, or pursue statutory remedies through the <strong>National Consumer Helpline (NCH)</strong> or appropriate Consumer Disputes Redressal Commissions in India.
        </p>
      </section>
    </LegalPageLayout>
  );
}
