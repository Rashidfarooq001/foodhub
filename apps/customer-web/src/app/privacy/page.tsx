'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Download,
  FileText,
  RotateCcw,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  MapPin,
  Bell,
  Mail,
  Lock,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';
import { getApiBaseUrl } from '@foodhub/config';
import { CustomerAuthGuard } from '../../components/common/CustomerAuthGuard';

const API_BASE = getApiBaseUrl();

export default function CustomerPrivacyCenterPage() {
  const { user, accessToken } = useAuthStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'consents' | 'requests' | 'complaints' | 'retention'
  >('overview');
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Request Forms State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  // Correction Form
  const [correctionField, setCorrectionField] = useState('FULL_NAME');
  const [correctionValue, setCorrectionValue] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  // Deletion Form
  const [deletionConfirmText, setDeletionConfirmText] = useState('');
  const [deletionReason, setDeletionReason] = useState('');

  // Complaint Form
  const [complaintCategory, setComplaintCategory] = useState('PRIVACY_CONCERN');
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintOrderNumber, setComplaintOrderNumber] = useState('');

  // Retention Policies
  const [retentionPolicies, setRetentionPolicies] = useState<any[]>([]);

  const fetchPrivacyData = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/privacy/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setProfileData(json.data);
      }

      // Fetch retention policies
      const retRes = await fetch(`${API_BASE}/privacy/retention-policies`);
      if (retRes.ok) {
        const retJson = await retRes.json();
        setRetentionPolicies(retJson.retentionPolicies || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch privacy data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrivacyData();
  }, [accessToken]);

  const showMsg = (msg: string, isError = false) => {
    setFeedback({ type: isError ? 'error' : 'success', message: msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Export Data Download
  const handleExportData = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/privacy/export`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to export data');
      const exportJson = await res.json();

      const blob = new Blob([JSON.stringify(exportJson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zaykafood-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMsg(
        'Your personal data archive was exported successfully in machine-readable JSON format.',
      );
    } catch (err: any) {
      showMsg(err.message || 'Export failed', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Consent
  const handleToggleConsent = async (
    consentType: string,
    currentGranted: boolean,
    purpose: string,
  ) => {
    setActionLoading(true);
    try {
      let res;
      if (currentGranted) {
        res = await fetch(`${API_BASE}/privacy/consent/withdraw`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ consentType, reason: 'Toggled by user in Privacy Center' }),
        });
      } else {
        res = await fetch(`${API_BASE}/privacy/consent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ consentType, purpose, granted: true, version: '2026.1' }),
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to update consent');
      }

      showMsg(currentGranted ? 'Consent withdrawn successfully.' : 'Consent granted and recorded.');
      await fetchPrivacyData();
    } catch (err: any) {
      showMsg(err.message || 'Consent update failed', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Correction Request
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionValue.trim()) return showMsg('Please enter corrected value', true);
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/privacy/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: 'DATA_CORRECTION',
          reason: correctionReason,
          correctionData: { [correctionField]: correctionValue },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to submit correction request');
      }

      showMsg('Data correction request submitted for administrative review.');
      setShowCorrectionModal(false);
      setCorrectionValue('');
      setCorrectionReason('');
      await fetchPrivacyData();
    } catch (err: any) {
      showMsg(err.message || 'Submission failed', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Deletion Request
  const handleSubmitDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deletionConfirmText !== 'DELETE MY ACCOUNT') {
      return showMsg('Please type exact confirmation: DELETE MY ACCOUNT', true);
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/privacy/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: 'DATA_DELETION',
          reason: deletionReason || 'Customer requested full account and PII erasure',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to submit deletion request');
      }

      showMsg(
        'Account deletion & anonymization request submitted. Our compliance team will process it within statutory timelines.',
      );
      setShowDeletionModal(false);
      setDeletionConfirmText('');
      setDeletionReason('');
      await fetchPrivacyData();
    } catch (err: any) {
      showMsg(err.message || 'Deletion request failed', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Complaint
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintSubject.trim() || !complaintDescription.trim()) {
      return showMsg('Please provide subject and detailed description', true);
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/privacy/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: profileData?.fullName || user?.firstName || 'Customer',
          email: profileData?.email || user?.email || 'customer@zaykafood.online',
          phone: profileData?.phone || user?.phone || '',
          orderNumber: complaintOrderNumber || undefined,
          category: complaintCategory,
          subject: complaintSubject,
          description: complaintDescription,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to submit complaint');
      }

      showMsg(
        'Grievance complaint submitted. You will receive an acknowledgement within 48 hours.',
      );
      setShowComplaintModal(false);
      setComplaintSubject('');
      setComplaintDescription('');
      setComplaintOrderNumber('');
      await fetchPrivacyData();
    } catch (err: any) {
      showMsg(err.message || 'Complaint submission failed', true);
    } finally {
      setActionLoading(false);
    }
  };

  const getConsentStatus = (type: string) => {
    if (!profileData?.consents) return false;
    const found = profileData.consents.find((c: any) => c.consentType === type);
    return found ? found.granted : false;
  };

  return (
    <CustomerAuthGuard>
      <div className="min-h-[100dvh] bg-gradient-to-b from-gray-50 via-white to-gray-50 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-4 lg:px-5 space-y-5">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-xs font-semibold text-gray-500">
            <Link href="/" className="hover:text-orange-600 transition">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <Link href="/profile" className="hover:text-orange-600 transition">
              My Account
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-orange-600 font-bold">Privacy &amp; Data Center</span>
          </nav>

          {/* Header Banner */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-10 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/60 px-3.5 py-1 text-xs font-black text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>DPDP Act, 2023 Self-Service Portal</span>
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Privacy &amp; Data Control Center
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Take control of your personal data. Export your records, manage optional processing
                consents, request data corrections, or exercise your statutory data deletion rights.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                onClick={handleExportData}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700 transition disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{actionLoading ? 'Exporting...' : 'Export My Data (JSON)'}</span>
              </button>

              <button
                onClick={fetchPrivacyData}
                className="p-3 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`rounded-2xl p-4 text-xs font-bold flex items-center gap-3 border ${
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

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
            {[
              { id: 'overview', label: 'My Data Overview', icon: FileText },
              { id: 'consents', label: 'Consent Preferences', icon: ShieldCheck },
              { id: 'requests', label: 'Privacy Requests', icon: Clock },
              { id: 'complaints', label: 'Grievances & Complaints', icon: HelpCircle },
              { id: 'retention', label: 'Retention Schedules', icon: Lock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Account Card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4 md:col-span-2">
                <h3 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">
                  Data Principal Profile Snapshot
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px]">
                      Registered Name
                    </span>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">
                      {profileData?.fullName || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px]">
                      Verified Mobile
                    </span>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">
                      {profileData?.phone || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px]">
                      Email Address
                    </span>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">
                      {profileData?.email || 'None'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px]">
                      Account Status
                    </span>
                    <p className="font-bold text-emerald-700 text-sm mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Active
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-gray-50 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      Saved Addresses
                    </span>
                    <p className="text-lg font-black text-gray-900">
                      {profileData?.metrics?.savedAddresses || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      Total Orders
                    </span>
                    <p className="text-lg font-black text-gray-900">
                      {profileData?.metrics?.totalOrders || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
                <h3 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">
                  Exercise Your Rights
                </h3>
                <div className="space-y-2.5">
                  <button
                    onClick={() => setShowCorrectionModal(true)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-gray-100 hover:border-orange-500 hover:bg-orange-50/40 text-left transition group"
                  >
                    <div className="flex items-center gap-2.5 text-xs font-bold text-gray-800 group-hover:text-orange-600">
                      <Edit3 className="h-4 w-4 text-orange-600" />
                      <span>Request Data Correction</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>

                  <button
                    onClick={() => setShowDeletionModal(true)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-rose-100 hover:border-rose-500 hover:bg-rose-50/40 text-left transition group"
                  >
                    <div className="flex items-center gap-2.5 text-xs font-bold text-rose-800 group-hover:text-rose-600">
                      <Trash2 className="h-4 w-4 text-rose-600" />
                      <span>Request Account Erasure</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>

                  <button
                    onClick={() => setShowComplaintModal(true)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-gray-100 hover:border-gray-900 hover:bg-gray-50 text-left transition group"
                  >
                    <div className="flex items-center gap-2.5 text-xs font-bold text-gray-800">
                      <HelpCircle className="h-4 w-4 text-gray-700" />
                      <span>File Privacy Grievance</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-3 text-[11px] text-gray-500 space-y-1">
                  <p>
                    <strong>Legal Framework:</strong> Digital Personal Data Protection Act, 2023
                  </p>
                  <p>
                    <strong>Grievance Email:</strong> businesscity05@gmail.com
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Consents */}
          {activeTab === 'consents' && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-gray-900">Consent Management Dashboard</h3>
                <p className="text-xs text-gray-600">
                  Under the DPDP Act 2023, you can grant or withdraw consent for optional data
                  processing purposes at any time.
                </p>
              </div>

              <div className="divide-y divide-gray-100 space-y-4">
                {/* Notice Consent (Mandatory) */}
                <div className="pt-4 flex items-start justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <span className="text-xs font-black text-gray-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-600" /> Terms &amp; Privacy Notice
                      Acknowledgment
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Essential agreement required for account existence and core transactional food
                      ordering services.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full shrink-0">
                    Mandatory for Service
                  </span>
                </div>

                {/* Location Processing Consent */}
                <div className="pt-4 flex items-start justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <span className="text-xs font-black text-gray-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-600" /> Location-Based Nearby Kitchen
                      Discovery
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Allows using browser/device GPS coordinates to calculate delivery fees, store
                      distance, and route eligible couriers.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleToggleConsent(
                        'LOCATION_DATA_PROCESSING',
                        getConsentStatus('LOCATION_DATA_PROCESSING'),
                        'Locality & distance calculation for food delivery',
                      )
                    }
                    disabled={actionLoading}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      getConsentStatus('LOCATION_DATA_PROCESSING')
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getConsentStatus('LOCATION_DATA_PROCESSING') ? '✓ Granted' : 'Opt In'}
                  </button>
                </div>

                {/* Marketing & Offers Consent */}
                <div className="pt-4 flex items-start justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <span className="text-xs font-black text-gray-900 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-orange-600" /> Promotional &amp; Seasonal Food
                      Offers
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Receive occasional SMS alerts for discount vouchers, festival menus, and local
                      restaurant promotions in Bandipora.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleToggleConsent(
                        'MARKETING_COMMUNICATIONS',
                        getConsentStatus('MARKETING_COMMUNICATIONS'),
                        'Promotional SMS and discount communications',
                      )
                    }
                    disabled={actionLoading}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      getConsentStatus('MARKETING_COMMUNICATIONS')
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getConsentStatus('MARKETING_COMMUNICATIONS') ? '✓ Granted' : 'Opt In'}
                  </button>
                </div>

                {/* Order Notifications */}
                <div className="pt-4 flex items-start justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <span className="text-xs font-black text-gray-900 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-orange-600" /> Real-time Order Tracking Push
                      Notifications
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Receive instant live alerts when your order is accepted, preparing,
                      dispatched, and out for delivery.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleToggleConsent(
                        'ORDER_NOTIFICATIONS',
                        getConsentStatus('ORDER_NOTIFICATIONS'),
                        'Transactional order status notifications',
                      )
                    }
                    disabled={actionLoading}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      getConsentStatus('ORDER_NOTIFICATIONS')
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getConsentStatus('ORDER_NOTIFICATIONS') ? '✓ Granted' : 'Opt In'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Requests Tracker */}
          {activeTab === 'requests' && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-gray-900">Your Privacy Requests</h3>
                  <p className="text-xs text-gray-600">
                    Track the status of your data access, correction, and deletion requests.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCorrectionModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold transition"
                  >
                    + Correction
                  </button>
                  <button
                    onClick={() => setShowDeletionModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition"
                  >
                    + Deletion
                  </button>
                </div>
              </div>

              {profileData?.recentRequests?.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400 bg-gray-50 rounded-2xl">
                  No privacy requests submitted yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left border border-gray-100 rounded-2xl overflow-hidden">
                    <thead className="bg-gray-50 font-bold uppercase text-gray-500">
                      <tr>
                        <th className="p-3">Request ID</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date Submitted</th>
                        <th className="p-3">Resolution / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {profileData?.recentRequests?.map((req: any) => (
                        <tr key={req.id}>
                          <td className="p-3 font-mono text-gray-500">
                            {req.id.substring(0, 8)}...
                          </td>
                          <td className="p-3 font-bold text-gray-900">{req.type}</td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                req.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : req.status === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="p-3 text-gray-500">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-gray-600">
                            {req.rejectionReason ||
                              req.responsePayload?.message ||
                              req.reason ||
                              'Under review'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Complaints */}
          {activeTab === 'complaints' && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-gray-900">
                    Privacy Complaints &amp; Grievances
                  </h3>
                  <p className="text-xs text-gray-600">
                    Submitted directly to Zayka Food Grievance Team (48-hour SLA).
                  </p>
                </div>
                <button
                  onClick={() => setShowComplaintModal(true)}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700 text-xs font-bold transition shadow-md shadow-orange-500/20"
                >
                  + File New Grievance
                </button>
              </div>

              {profileData?.recentComplaints?.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400 bg-gray-50 rounded-2xl">
                  No grievances submitted. Everything looks clean!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left border border-gray-100 rounded-2xl overflow-hidden">
                    <thead className="bg-gray-50 font-bold uppercase text-gray-500">
                      <tr>
                        <th className="p-3">Complaint Ticket</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Resolution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {profileData?.recentComplaints?.map((c: any) => (
                        <tr key={c.id}>
                          <td className="p-3 font-mono text-gray-500">{c.id.substring(0, 8)}...</td>
                          <td className="p-3 font-bold text-gray-800">{c.category}</td>
                          <td className="p-3 text-gray-900 font-medium">{c.subject}</td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                c.status === 'RESOLVED'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">
                            {c.resolution || 'Investigation in progress'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Retention Schedules */}
          {activeTab === 'retention' && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-gray-900">
                  Platform Data Retention Schedules
                </h3>
                <p className="text-xs text-gray-600">
                  Transparent schedules governing how long different categories of personal and
                  commercial records are retained in compliance with Indian law.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left border border-gray-100 rounded-2xl overflow-hidden">
                  <thead className="bg-gray-50 font-bold uppercase text-gray-500">
                    <tr>
                      <th className="p-3">Category</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Retention Period</th>
                      <th className="p-3">Legal Basis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {retentionPolicies.map((p: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-gray-900">{p.category}</td>
                        <td className="p-3 text-gray-600">{p.description}</td>
                        <td className="p-3 font-bold text-orange-600">{p.retentionDays} Days</td>
                        <td className="p-3 text-gray-500">{p.legalBasis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Correction Modal */}
        {showCorrectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl space-y-4">
              <h3 className="text-base font-black text-gray-900">Request Data Correction</h3>
              <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Select Field to Correct
                  </label>
                  <select
                    value={correctionField}
                    onChange={(e) => setCorrectionField(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 p-2.5 font-bold text-gray-800"
                  >
                    <option value="FULL_NAME">Full Name</option>
                    <option value="EMAIL">Email Address</option>
                    <option value="PHONE">Phone Number</option>
                    <option value="ADDRESS">Saved Delivery Address</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Corrected Value *</label>
                  <input
                    type="text"
                    required
                    value={correctionValue}
                    onChange={(e) => setCorrectionValue(e.target.value)}
                    placeholder="Enter correct details"
                    className="w-full rounded-2xl border border-gray-200 p-2.5 font-bold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Reason for Correction
                  </label>
                  <textarea
                    rows={2}
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="e.g. Spelling error or change in contact number"
                    className="w-full rounded-2xl border border-gray-200 p-2.5 text-gray-800"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCorrectionModal(false)}
                    className="flex-1 py-2.5 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-2xl bg-orange-600 font-bold text-white hover:bg-orange-700"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Deletion Modal */}
        {showDeletionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-rose-600 font-black">
                <AlertTriangle className="h-5 w-5" />
                <h3>Request Account Erasure (DPDP Act)</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Submitting this request permanently purges your customer profile, active login
                sessions, and saved delivery addresses. Non-personal financial order invoices will
                be retained for 8 years to comply with Indian GST laws.
              </p>
              <form onSubmit={handleSubmitDeletion} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Type <span className="font-mono text-rose-600">DELETE MY ACCOUNT</span> to
                    confirm *
                  </label>
                  <input
                    type="text"
                    required
                    value={deletionConfirmText}
                    onChange={(e) => setDeletionConfirmText(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    className="w-full rounded-2xl border border-rose-200 p-2.5 font-bold text-rose-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Optional Reason</label>
                  <textarea
                    rows={2}
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    placeholder="Tell us why you are leaving"
                    className="w-full rounded-2xl border border-gray-200 p-2.5 text-gray-800"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeletionModal(false)}
                    className="flex-1 py-2.5 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || deletionConfirmText !== 'DELETE MY ACCOUNT'}
                    className="flex-1 py-2.5 rounded-2xl bg-rose-600 font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    Submit Erasure
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Complaint Modal */}
        {showComplaintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-black text-gray-900">File a Privacy Grievance</h3>
              <form onSubmit={handleSubmitComplaint} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Grievance Category *</label>
                  <select
                    value={complaintCategory}
                    onChange={(e) => setComplaintCategory(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 p-2.5 font-bold text-gray-800"
                  >
                    <option value="PRIVACY_CONCERN">General Privacy Concern</option>
                    <option value="INCORRECT_DATA">Incorrect / Misleading Personal Data</option>
                    <option value="UNAUTHORIZED_ACCESS">Unauthorized Account Access</option>
                    <option value="LOCATION_TRACKING">Location Tracking Inquiry</option>
                    <option value="UNAUTHORIZED_SHARING">Unauthorized Data Sharing</option>
                    <option value="ACCOUNT_SECURITY">Account Security Incident</option>
                    <option value="OTHER">Other Compliance Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Order Number (if applicable)
                  </label>
                  <input
                    type="text"
                    value={complaintOrderNumber}
                    onChange={(e) => setComplaintOrderNumber(e.target.value)}
                    placeholder="e.g. FH-123456"
                    className="w-full rounded-2xl border border-gray-200 p-2.5 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Grievance Subject *</label>
                  <input
                    type="text"
                    required
                    value={complaintSubject}
                    onChange={(e) => setComplaintSubject(e.target.value)}
                    placeholder="Brief summary of your grievance"
                    className="w-full rounded-2xl border border-gray-200 p-2.5 font-bold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Detailed Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={complaintDescription}
                    onChange={(e) => setComplaintDescription(e.target.value)}
                    placeholder="Provide full facts and context..."
                    className="w-full rounded-2xl border border-gray-200 p-2.5 text-gray-800"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowComplaintModal(false)}
                    className="flex-1 py-2.5 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-2xl bg-orange-600 font-bold text-white hover:bg-orange-700"
                  >
                    Submit Grievance
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CustomerAuthGuard>
  );
}
