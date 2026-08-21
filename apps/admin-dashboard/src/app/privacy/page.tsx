'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  Lock,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Server,
  Activity,
  Layers,
  Check,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export const formatIST = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return (
      d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }) + ' IST'
    );
  } catch {
    return String(dateStr);
  }
};

export default function AdminPrivacyDashboardPage() {
  const [token, setToken] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    'consents' | 'audit' | 'policies' | 'requests' | 'complaints' | 'incidents' | 'inventory' | 'retention'
  >('consents');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Consent Records State & Filters
  const [consents, setConsents] = useState<any[]>([]);
  const [consentTotal, setConsentTotal] = useState(0);
  const [consentPage, setConsentPage] = useState(1);
  const [consentTotalPages, setConsentTotalPages] = useState(1);
  const [consentSearch, setConsentSearch] = useState('');
  const [consentTypeFilter, setConsentTypeFilter] = useState('');
  const [consentStatusFilter, setConsentStatusFilter] = useState('');
  const [consentSourceFilter, setConsentSourceFilter] = useState('');
  const [selectedConsent, setSelectedConsent] = useState<any | null>(null);

  // 2. Audit Logs State & Filters
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  // 3. Policy Registry State
  const [policies, setPolicies] = useState<any[]>([]);

  // 4. Other Compliance Data
  const [requests, setRequests] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<any[]>([]);

  // Modals
  const [showDeletionModal, setShowDeletionModal] = useState<any | null>(null);
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false);

  // New Incident Form State
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentType, setIncidentType] = useState('UNAUTHORIZED_ACCESS_ATTEMPT');
  const [incidentSeverity, setIncidentSeverity] = useState('LOW');
  const [affectedRecords, setAffectedRecords] = useState(0);
  const [affectedSystems, setAffectedSystems] = useState('API Gateway, Redis Session Cache');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [mitigationSteps, setMitigationSteps] = useState('');
  const [notificationRequired, setNotificationRequired] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken =
        localStorage.getItem('foodhub_admin_access_token') ||
        localStorage.getItem('foodhub_access_token') ||
        localStorage.getItem('token');
      setToken(storedToken);
    }
  }, []);

  const showMsg = (msg: string, isError = false) => {
    setFeedback({ type: isError ? 'error' : 'success', message: msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Fetch Legal Consents (Paginated)
  const fetchConsents = useCallback(async () => {
    if (!token) return;
    try {
      const q = new URLSearchParams({
        page: String(consentPage),
        limit: '15',
      });
      if (consentSearch) q.set('search', consentSearch);
      if (consentTypeFilter) q.set('consentType', consentTypeFilter);
      if (consentStatusFilter) q.set('status', consentStatusFilter);
      if (consentSourceFilter) q.set('source', consentSourceFilter);

      const res = await fetch(API_BASE + '/admin/privacy/consents?' + q.toString(), {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        const d = await res.json();
        setConsents(d.items || []);
        setConsentTotal(d.total || 0);
        setConsentTotalPages(d.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load consents', err);
    }
  }, [token, consentPage, consentSearch, consentTypeFilter, consentStatusFilter, consentSourceFilter]);

  // Fetch Audit Logs (Paginated)
  const fetchAuditLogs = useCallback(async () => {
    if (!token) return;
    try {
      const q = new URLSearchParams({
        page: String(auditPage),
        limit: '15',
      });
      if (auditSearch) q.set('search', auditSearch);
      if (auditActionFilter) q.set('action', auditActionFilter);

      const res = await fetch(API_BASE + '/admin/privacy/audit-logs?' + q.toString(), {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        const d = await res.json();
        setAuditLogs(d.items || []);
        setAuditTotal(d.total || 0);
        setAuditTotalPages(d.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    }
  }, [token, auditPage, auditSearch, auditActionFilter]);

  // Fetch Policies
  const fetchPolicies = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(API_BASE + '/admin/privacy/policies', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        const d = await res.json();
        setPolicies(d.policies || []);
      }
    } catch (err) {
      console.error('Failed to load policies', err);
    }
  }, [token]);

  // Fetch all standard datasets
  const fetchAllData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const headers = { Authorization: 'Bearer ' + token };

      await Promise.all([
        fetchConsents(),
        fetchAuditLogs(),
        fetchPolicies(),
        fetch(API_BASE + '/admin/privacy/requests', { headers })
          .then((r) => (r.ok ? r.json() : { requests: [] }))
          .then((d) => setRequests(d.requests || [])),
        fetch(API_BASE + '/admin/privacy/complaints', { headers })
          .then((r) => (r.ok ? r.json() : { complaints: [] }))
          .then((d) => setComplaints(d.complaints || [])),
        fetch(API_BASE + '/admin/privacy/incidents', { headers })
          .then((r) => (r.ok ? r.json() : { incidents: [] }))
          .then((d) => setIncidents(d.incidents || [])),
        fetch(API_BASE + '/privacy/inventory')
          .then((r) => (r.ok ? r.json() : { dataInventory: [] }))
          .then((d) => setInventory(d.dataInventory || [])),
        fetch(API_BASE + '/privacy/vendor-inventory')
          .then((r) => (r.ok ? r.json() : { subprocessors: [] }))
          .then((d) => setVendors(d.subprocessors || [])),
        fetch(API_BASE + '/privacy/retention-policies')
          .then((r) => (r.ok ? r.json() : { retentionPolicies: [] }))
          .then((d) => setRetentionPolicies(d.retentionPolicies || [])),
      ]);
    } catch (err) {
      console.error('Failed to load admin privacy data', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, fetchConsents, fetchAuditLogs, fetchPolicies]);

  useEffect(() => {
    if (token) fetchAllData();
  }, [token, fetchAllData]);

  // Refetch when tab changes or specific page changes
  useEffect(() => {
    if (activeTab === 'consents') fetchConsents();
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'policies') fetchPolicies();
  }, [activeTab, fetchConsents, fetchAuditLogs, fetchPolicies]);

  // Request Actions
  const handleUpdateRequestStatus = async (id: string, status: string, rejectionReason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(API_BASE + '/admin/privacy/requests/' + id, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ status, rejectionReason }),
      });

      if (!res.ok) throw new Error('Failed to update request');
      showMsg('Request status updated to ' + status);
      await fetchAllData();
    } catch (err: any) {
      showMsg(err.message || 'Action failed', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Safe Deletion Execution
  const handleExecuteDeletion = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(API_BASE + '/admin/privacy/requests/' + id + '/execute-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to execute deletion');
      }

      showMsg('Account deletion & ledger anonymization transaction executed successfully.');
      setShowDeletionModal(null);
      await fetchAllData();
    } catch (err: any) {
      showMsg(err.message || 'Deletion execution failed', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Complaint Resolution
  const handleResolveComplaint = async (id: string, resolution: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(API_BASE + '/admin/privacy/complaints/' + id, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ status: 'RESOLVED', resolution }),
      });

      if (!res.ok) throw new Error('Failed to resolve complaint');
      showMsg('Grievance marked as RESOLVED with formal resolution notes.');
      await fetchAllData();
    } catch (err: any) {
      showMsg(err.message || 'Resolution failed', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Create Incident
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(API_BASE + '/admin/privacy/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          incidentTitle,
          incidentType,
          severity: incidentSeverity,
          affectedRecordsCount: Number(affectedRecords),
          affectedSystems: affectedSystems.split(',').map((s) => s.trim()),
          description: incidentDescription,
          mitigationSteps,
          notificationRequired,
        }),
      });

      if (!res.ok) throw new Error('Failed to log incident');
      showMsg('Security incident registered into CERT-In audit timeline.');
      setShowNewIncidentModal(false);
      setIncidentTitle('');
      setIncidentDescription('');
      setMitigationSteps('');
      await fetchAllData();
    } catch (err: any) {
      showMsg(err.message || 'Incident logging failed', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Retention Cleanup
  const handleTriggerRetention = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(API_BASE + '/admin/privacy/retention/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ categories: ['CUSTOMER_PROFILE', 'SECURITY_AUDIT_LOGS'] }),
      });
      if (!res.ok) throw new Error('Retention job execution failed');
      const data = await res.json();
      showMsg('Data retention cleanup completed: ' + (data.summary?.expiredOtpsPurged || 0) + ' expired OTPs purged.');
      await fetchAllData();
    } catch (err: any) {
      showMsg(err.message || 'Cleanup error', true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Compliance Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
            Privacy, Legal Consent &amp; Audit Control
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Zayka Food • Digital Personal Data Protection Act (DPDP Act 2023) &amp; Consumer Protection Compliance Center
          </p>
        </div>

        <button
          onClick={fetchAllData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw className={'h-3.5 w-3.5 ' + (isLoading ? 'animate-spin' : '')} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={'p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm border ' + (
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          )}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-200 pb-1 scrollbar-none">
        {[
          { id: 'consents', label: 'Consent Records (' + consentTotal + ')', icon: UserCheck },
          { id: 'audit', label: 'Audit Trail (' + auditTotal + ')', icon: Activity },
          { id: 'policies', label: 'Policy Versions (' + policies.length + ')', icon: BookOpen },
          { id: 'requests', label: 'DSAR Requests (' + requests.length + ')', icon: FileText },
          { id: 'complaints', label: 'Grievances (' + complaints.length + ')', icon: AlertTriangle },
          { id: 'incidents', label: 'Breach Logs (' + incidents.length + ')', icon: Lock },
          { id: 'inventory', label: 'Data Inventory', icon: Layers },
          { id: 'retention', label: 'Retention Policies', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ' + (
                isActive
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LEGAL CONSENT RECORDS */}
      {activeTab === 'consents' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-gray-900">Legal Consent &amp; Acknowledgement Records</h3>
              <p className="text-xs text-gray-500">
                Authoritative, immutable records of customer acceptance of Terms &amp; Conditions and Privacy Policy.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customer, ID, phone..."
                  value={consentSearch}
                  onChange={(e) => {
                    setConsentSearch(e.target.value);
                    setConsentPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-2xl border border-gray-200 text-xs text-gray-900 focus:border-purple-600 focus:outline-none w-56 font-medium"
                />
              </div>

              <select
                value={consentTypeFilter}
                onChange={(e) => {
                  setConsentTypeFilter(e.target.value);
                  setConsentPage(1);
                }}
                className="py-1.5 px-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 focus:border-purple-600 focus:outline-none"
              >
                <option value="">All Consent Types</option>
                <option value="TERMS_AND_CONDITIONS">Terms &amp; Conditions</option>
                <option value="PRIVACY_POLICY">Privacy Policy</option>
                <option value="TERMS_AND_PRIVACY_NOTICE">Notice (Legacy)</option>
              </select>

              <select
                value={consentStatusFilter}
                onChange={(e) => {
                  setConsentStatusFilter(e.target.value);
                  setConsentPage(1);
                }}
                className="py-1.5 px-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 focus:border-purple-600 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="ACCEPTED">Accepted (Granted)</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>

              <select
                value={consentSourceFilter}
                onChange={(e) => {
                  setConsentSourceFilter(e.target.value);
                  setConsentPage(1);
                }}
                className="py-1.5 px-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 focus:border-purple-600 focus:outline-none"
              >
                <option value="">All Sources</option>
                <option value="CUSTOMER_REGISTRATION">Customer Registration</option>
                <option value="POLICY_REACCEPTANCE">Policy Re-acceptance</option>
                <option value="WEB_APP">Web App</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Consent Type</th>
                  <th className="p-3">Policy Name</th>
                  <th className="p-3">Version</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Accepted At (IST)</th>
                  <th className="p-3">Source</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {consents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">
                      No consent records match your search query.
                    </td>
                  </tr>
                ) : (
                  consents.map((c) => {
                    const fullName = [c.user?.profile?.firstName, c.user?.profile?.lastName]
                      .filter(Boolean)
                      .join(' ') || 'Customer';
                    const isTerms = c.consentType === 'TERMS_AND_CONDITIONS';
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-3">
                          <p className="font-bold text-gray-900">{fullName}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{c.user?.phone || c.user?.email || c.userId}</p>
                        </td>
                        <td className="p-3">
                          <span
                            className={'px-2.5 py-0.5 rounded-full font-bold text-[10px] ' + (
                              isTerms ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                            )}
                          >
                            {isTerms ? 'Terms' : 'Privacy'}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-gray-900">{c.policyName || c.consentType}</td>
                        <td className="p-3 font-mono font-bold text-gray-700">v{c.version}</td>
                        <td className="p-3">
                          <span
                            className={'px-2.5 py-0.5 rounded-full font-bold text-[10px] ' + (
                              c.granted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            )}
                          >
                            {c.granted ? 'Accepted' : 'Withdrawn'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-gray-700">{formatIST(c.acceptedAt || c.grantedAt)}</td>
                        <td className="p-3 text-gray-500 font-medium">{c.source}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedConsent(c)}
                            className="px-3 py-1 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-purple-100 hover:text-purple-900 transition flex items-center gap-1 inline-flex"
                          >
                            <Eye className="h-3.5 w-3.5" /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 font-medium">
            <span>
              Showing {consents.length} of {consentTotal} records (Page {consentPage} of {consentTotalPages})
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setConsentPage((p) => Math.max(1, p - 1))}
                disabled={consentPage <= 1}
                className="p-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-bold text-gray-900">
                {consentPage} / {consentTotalPages}
              </span>
              <button
                onClick={() => setConsentPage((p) => Math.min(consentTotalPages, p + 1))}
                disabled={consentPage >= consentTotalPages}
                className="p-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-gray-900">Privacy &amp; Legal Audit Trail</h3>
              <p className="text-xs text-gray-500">
                Cryptographically verifiable, tamper-evident log of all consent, data access, and administrative actions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search actions, actor, ID..."
                  value={auditSearch}
                  onChange={(e) => {
                    setAuditSearch(e.target.value);
                    setAuditPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-2xl border border-gray-200 text-xs text-gray-900 focus:border-purple-600 focus:outline-none w-56 font-medium"
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditActionFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="py-1.5 px-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 focus:border-purple-600 focus:outline-none"
              >
                <option value="">All Actions</option>
                <option value="CUSTOMER_LEGAL_CONSENT_ACCEPTED">Consent Accepted</option>
                <option value="CONSENT_WITHDRAWN">Consent Withdrawn</option>
                <option value="CUSTOMER_DATA_EXPORT_GENERATED">Data Export</option>
                <option value="ADMIN_EXECUTE_SAFE_ACCOUNT_DELETION">Account Erasure</option>
                <option value="ADMIN_RECORD_BREACH_INCIDENT">Breach Incident</option>
                <option value="ADMIN_RESOLVED_COMPLAINT">Grievance Resolved</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Timestamp (IST)</th>
                  <th className="p-3">Actor / Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Entity ID</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">
                      No audit events found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-3 font-mono text-gray-700">{formatIST(a.createdAt)}</td>
                      <td className="p-3">
                        <span className="font-bold text-gray-900">{a.actorRole || 'SYSTEM'}</span>
                        {a.actorId && <p className="text-[10px] font-mono text-gray-400 truncate max-w-[120px]">{a.actorId}</p>}
                      </td>
                      <td className="p-3 font-mono font-bold text-purple-800">{a.action}</td>
                      <td className="p-3 text-gray-800 font-medium">{a.entity}</td>
                      <td className="p-3 font-mono text-[10px] text-gray-500 truncate max-w-[120px]">{a.entityId || '—'}</td>
                      <td className="p-3 font-mono text-[10px] text-gray-400">{a.ipAddress || 'Internal'}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedAuditLog(a)}
                          className="px-3 py-1 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-purple-100 hover:text-purple-900 transition flex items-center gap-1 inline-flex"
                        >
                          <Eye className="h-3.5 w-3.5" /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 font-medium">
            <span>
              Showing {auditLogs.length} of {auditTotal} events (Page {auditPage} of {auditTotalPages})
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                disabled={auditPage <= 1}
                className="p-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-bold text-gray-900">
                {auditPage} / {auditTotalPages}
              </span>
              <button
                onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                disabled={auditPage >= auditTotalPages}
                className="p-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: POLICY VERSIONS */}
      {activeTab === 'policies' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-gray-900">Statutory Legal Policy Version Registry</h3>
            <p className="text-xs text-gray-500">
              Active and historical legal policies published on Zayka Food. Policy changes generate new versioned records without modifying historical acceptances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((p) => (
              <div key={p.id} className="p-5 rounded-3xl border border-gray-100 bg-gray-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-purple-700" />
                    <h4 className="text-sm font-black text-gray-900">{p.policyName}</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                    {p.status}
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">{p.summary}</p>

                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700">Active Version: <span className="font-mono text-purple-800">v{p.version}</span></span>
                  <span className="text-[11px] text-gray-500 font-mono">Published: {formatIST(p.publishedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DSAR REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-black text-gray-900">Data Subject Access &amp; Erasure Requests (DSAR)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Customer ID / Phone</th>
                  <th className="p-3">Request Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Requested At (IST)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      No pending DSAR requests.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{r.user?.phone || 'Customer'}</p>
                        <span className="text-[10px] font-mono text-gray-400">{r.userId}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-purple-900">{r.type}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={'px-2.5 py-0.5 rounded-full font-bold text-[10px] ' + (
                            r.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          )}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-gray-700">{formatIST(r.requestedAt)}</td>
                      <td className="p-3 text-right space-x-1">
                        {r.type === 'DATA_DELETION' && r.status !== 'COMPLETED' && (
                          <button
                            onClick={() => setShowDeletionModal(r)}
                            className="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
                          >
                            Execute Deletion
                          </button>
                        )}
                        {r.status === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateRequestStatus(r.id, 'COMPLETED')}
                            className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: GRIEVANCES & COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-black text-gray-900">Grievance Redressal Tickets (48-Hour SLA)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Complainant</th>
                  <th className="p-3">Subject &amp; Category</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Received At (IST)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      No grievance tickets logged.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{c.name}</p>
                        <p className="text-[10px] text-gray-500">{c.email}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{c.subject}</p>
                        <span className="text-[10px] text-gray-400">{c.category}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-purple-900">{c.priority}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={'px-2.5 py-0.5 rounded-full font-bold text-[10px] ' + (
                            c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          )}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-gray-700">{formatIST(c.createdAt)}</td>
                      <td className="p-3 text-right">
                        {c.status !== 'RESOLVED' && (
                          <button
                            onClick={() => {
                              const res = prompt('Enter resolution notes for this grievance:');
                              if (res) handleResolveComplaint(c.id, res);
                            }}
                            className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: DATA BREACH INCIDENTS */}
      {activeTab === 'incidents' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900">Security &amp; Data Breach Incident Registry</h3>
            <button
              onClick={() => setShowNewIncidentModal(true)}
              className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition flex items-center gap-1.5 shadow-md shadow-rose-500/20"
            >
              <Plus className="h-4 w-4" /> Log Security Incident
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Title &amp; Type</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Affected Records</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Detected At (IST)</th>
                  <th className="p-3">Mitigation / SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      No security incidents recorded.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-gray-50/50">
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{inc.incidentTitle}</p>
                        <span className="text-[10px] text-gray-400">{inc.incidentType}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={'px-2.5 py-0.5 rounded-full font-bold text-[10px] ' + (
                            inc.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : inc.severity === 'HIGH'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                          )}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-gray-800">{inc.affectedRecordsCount}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 font-bold text-gray-800 text-[10px]">
                          {inc.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-gray-700">{formatIST(inc.detectedAt)}</td>
                      <td className="p-3 text-gray-600 max-w-xs truncate">{inc.mitigationSteps || inc.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: DATA INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-gray-900">Internal Data Inventory</h3>
            <div className="space-y-3">
              {inventory.map((cat, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900">{cat.categoryName}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                      {cat.userType}
                    </span>
                  </div>
                  <p className="text-gray-600 text-[11px]">
                    <strong>Fields:</strong> {cat.fields?.join(', ')}
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    <strong>Basis:</strong> {cat.legalBasis}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-gray-900">Authorized Sub-processors &amp; Vendors</h3>
            <div className="space-y-3">
              {vendors.map((v, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900">{v.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                      {v.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-[11px]">
                    <strong>Service:</strong> {v.serviceCategory}
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    <strong>Data Processed:</strong> {v.dataProcessed?.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: RETENTION POLICIES */}
      {activeTab === 'retention' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-gray-900">Data Retention &amp; Auto-Purge Schedules</h3>
              <p className="text-xs text-gray-500">
                Statutory retention periods under Income Tax Act, GST Act 2017, and DPDP Act 2023.
              </p>
            </div>
            <button
              onClick={handleTriggerRetention}
              disabled={actionLoading}
              className="px-4 py-2 rounded-2xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition shadow-sm"
            >
              Run Retention Purge Job
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {retentionPolicies.map((p, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-purple-900">{p.category}</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md font-bold text-[10px]">
                    {p.retentionDays} Days
                  </span>
                </div>
                <p className="text-gray-700 font-medium">{p.description}</p>
                <p className="text-gray-400 text-[10px]">Legal basis: {p.legalBasis}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: CONSENT DETAILS VIEW */}
      {selectedConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-700" />
                <h3 className="text-base font-black text-gray-900">Legal Consent Record Details</h3>
              </div>
              <button onClick={() => setSelectedConsent(null)} className="p-1 rounded-xl hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Customer Name</span>
                  <span className="font-black text-gray-900 text-sm">
                    {[selectedConsent.user?.profile?.firstName, selectedConsent.user?.profile?.lastName]
                      .filter(Boolean)
                      .join(' ') || 'Customer'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Status</span>
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md inline-block">
                    {selectedConsent.granted ? 'Accepted' : 'Withdrawn'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Customer ID:</span>
                  <span className="font-mono text-gray-900 font-bold">{selectedConsent.userId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Consent Record ID:</span>
                  <span className="font-mono text-gray-900">{selectedConsent.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Consent Type:</span>
                  <span className="font-bold text-purple-900">{selectedConsent.consentType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Policy:</span>
                  <span className="font-bold text-gray-900">{selectedConsent.policyName || 'Zayka Food Policy'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Policy Version:</span>
                  <span className="font-mono font-bold text-purple-800">v{selectedConsent.version}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Accepted At (IST):</span>
                  <span className="font-mono font-bold text-gray-900">
                    {formatIST(selectedConsent.acceptedAt || selectedConsent.grantedAt)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Source:</span>
                  <span className="font-medium text-gray-800">{selectedConsent.source}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Client IP:</span>
                  <span className="font-mono text-gray-700">{selectedConsent.ipAddress || 'Not Captured'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">User Agent:</span>
                  <span className="font-mono text-[10px] text-gray-600 truncate max-w-[240px]">
                    {selectedConsent.userAgent || 'Web Browser'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px]">
                <strong>Immutable Legal Evidence:</strong> Under the Digital Personal Data Protection Act, 2023, this consent record represents authoritative evidence of affirmative agreement and cannot be altered or deleted.
              </div>
            </div>

            <button
              onClick={() => setSelectedConsent(null)}
              className="w-full py-2.5 rounded-2xl bg-gray-900 text-white font-bold hover:bg-black transition"
            >
              Close Record View
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: AUDIT LOG INSPECT VIEW */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-700" />
                <h3 className="text-base font-black text-gray-900">Audit Trail Event Inspection</h3>
              </div>
              <button onClick={() => setSelectedAuditLog(null)} className="p-1 rounded-xl hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Action:</span>
                  <span className="font-mono font-bold text-purple-800">{selectedAuditLog.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Timestamp:</span>
                  <span className="font-mono font-bold text-gray-900">{formatIST(selectedAuditLog.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Actor Role:</span>
                  <span className="font-bold text-gray-900">{selectedAuditLog.actorRole || 'SYSTEM'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Actor ID:</span>
                  <span className="font-mono text-gray-700">{selectedAuditLog.actorId || 'System'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Entity:</span>
                  <span className="font-bold text-gray-800">{selectedAuditLog.entity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Entity ID:</span>
                  <span className="font-mono text-gray-700">{selectedAuditLog.entityId || '—'}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Sanitized Event Metadata</label>
                <pre className="p-3 rounded-2xl bg-gray-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedAuditLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <button
              onClick={() => setSelectedAuditLog(null)}
              className="w-full py-2.5 rounded-2xl bg-gray-900 text-white font-bold hover:bg-black transition"
            >
              Close Event View
            </button>
          </div>
        </div>
      )}

      {/* Safe Deletion Execution Modal */}
      {showDeletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-black">
              <AlertTriangle className="h-5 w-5" />
              <h3>Execute Account Erasure Transaction</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              You are about to execute a cryptographic anonymization on user <strong>{showDeletionModal.user?.phone}</strong>. This purges active sessions, delivery addresses, and personal name. Financial order invoices remain intact for statutory GST audit compliance.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeletionModal(null)}
                className="flex-1 py-2.5 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteDeletion(showDeletionModal.id)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 font-bold text-white hover:bg-rose-700"
              >
                Confirm &amp; Anonymize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Incident Modal */}
      {showNewIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-gray-900">Log Security or Data Breach Incident</h3>
            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Incident Title *</label>
                <input
                  type="text"
                  required
                  value={incidentTitle}
                  onChange={(e) => setIncidentTitle(e.target.value)}
                  placeholder="e.g. Unauthenticated API Query Spike detected on /api/v1/menus"
                  className="w-full rounded-2xl border border-gray-200 p-2.5 text-gray-900 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Severity *</label>
                  <select
                    value={incidentSeverity}
                    onChange={(e) => setIncidentSeverity(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 p-2.5 font-bold text-gray-900"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Affected Records *</label>
                  <input
                    type="number"
                    value={affectedRecords}
                    onChange={(e) => setAffectedRecords(Number(e.target.value))}
                    className="w-full rounded-2xl border border-gray-200 p-2.5 text-gray-900 font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  placeholder="Technical findings, discovery timestamp, and threat vectors..."
                  className="w-full rounded-2xl border border-gray-200 p-2.5 text-gray-900"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Mitigation Steps</label>
                <textarea
                  rows={2}
                  value={mitigationSteps}
                  onChange={(e) => setMitigationSteps(e.target.value)}
                  placeholder="Actions taken to contain and patch vulnerability..."
                  className="w-full rounded-2xl border border-gray-200 p-2.5 text-gray-900"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewIncidentModal(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-2xl bg-purple-600 font-bold text-white hover:bg-purple-700"
                >
                  Save Incident Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
