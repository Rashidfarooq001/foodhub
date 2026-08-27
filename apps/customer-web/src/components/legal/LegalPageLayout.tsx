'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  FileText,
  RotateCcw,
  Truck,
  Cookie,
  HelpCircle,
  Mail,
  MapPin,
  Building2,
  ChevronRight,
  Scale,
} from 'lucide-react';

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

const LEGAL_NAV_ITEMS = [
  { label: 'Privacy Policy', href: '/privacy-policy', icon: ShieldCheck },
  { label: 'Terms & Conditions', href: '/terms-and-conditions', icon: FileText },
  { label: 'Refund & Cancellation', href: '/refund-policy', icon: RotateCcw },
  { label: 'Delivery Policy', href: '/delivery-policy', icon: Truck },
  { label: 'Cookie Policy', href: '/cookie-policy', icon: Cookie },
  { label: 'Grievance Redressal', href: '/grievance-redressal', icon: HelpCircle },
];

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  title,
  subtitle,
  lastUpdated = 'February 2026',
  children,
}) => {
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-gray-50 via-white to-gray-50 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-4 lg:px-5">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center space-x-2 text-xs font-semibold text-gray-500">
          <Link href="/" className="hover:text-orange-600 transition">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-400">Legal &amp; Policies</span>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-orange-600 font-bold">{title}</span>
        </nav>

        {/* Page Header */}
        <header className="mb-10 rounded-2xl border border-gray-100 bg-white p-5 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute -right-8 -top-5 h-44 w-44 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 border border-orange-200/60 px-3.5 py-1 text-xs font-black text-orange-800">
              <Scale className="h-3.5 w-3.5 text-orange-600" />
              <span>Official Policy Document • Indian Legal Framework</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 leading-tight">
              {title}
            </h1>
            <p className="text-sm sm:text-base font-medium text-gray-600 leading-relaxed">
              {subtitle}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <span>
                <strong>Effective Date:</strong> {lastUpdated}
              </span>
              <span>•</span>
              <span>
                <strong>Entity Structure:</strong> Individual / Sole Proprietorship
              </span>
              <span>•</span>
              <span>
                <strong>Operating Jurisdiction:</strong> Bandipora, Jammu &amp; Kashmir, India
              </span>
            </div>
          </div>
        </header>

        {/* Main Grid: Sidebar + Content */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
            <div className="sticky top-24 space-y-4">
              {/* Policies Navigation Menu */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 px-3 pb-2 border-b border-gray-100">
                  Legal Documents
                </h3>
                <nav className="space-y-1">
                  {LEGAL_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold transition ${
                          isActive
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                            : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Entity & Contact Summary Card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3 text-xs">
                <h4 className="font-black text-gray-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-600" /> Operating Entity Details
                </h4>
                <div className="space-y-2 text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  <p>
                    <strong className="text-gray-900">Brand / Platform:</strong> Zayka Food
                  </p>
                  <p>
                    <strong className="text-gray-900">Legal Structure:</strong> Individual / Proprietorship
                  </p>
                  <p className="flex items-start gap-1.5 pt-1">
                    <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0 mt-0.5" />
                    <span>Kehnusa, Bandipora, Jammu &amp; Kashmir, India</span>
                  </p>
                  <p className="flex items-center gap-1.5 pt-1">
                    <Mail className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                    <a
                      href="mailto:businesscity05@gmail.com"
                      className="text-orange-600 hover:underline font-bold"
                    >
                      businesscity05@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              {/* Statutory Note */}
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-4 text-[11px] text-amber-900 leading-relaxed">
                <strong>Legal Notice:</strong> Zayka Food operates as a technology-driven, multi-vendor marketplace connecting customers, independent restaurants, and courier partners. All contracts and policies are governed by the laws of India.
              </div>
            </div>
          </aside>

          {/* Policy Main Article Content */}
          <main className="lg:col-span-8 xl:col-span-9">
            <article className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-10 shadow-sm prose prose-orange max-w-none text-gray-800 leading-relaxed space-y-5">
              {children}
            </article>
          </main>
        </div>
      </div>
    </div>
  );
};
