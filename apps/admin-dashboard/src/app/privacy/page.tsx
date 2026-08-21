'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function AdminPrivacyDashboardPage() {
  const [token, setToken] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'requests' | 'complaints' | 'incidents' | 'audit' | 'inventory'>('requests');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data states
  const [requests, setRequests] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  // Modals
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
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

  const fetchAllData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Requests
      const reqRes = await fetch(`${API_BASE}/admin/privacy/requests`, { headers });
      if (reqRes.ok) {
        const d = await reqRes.json();
        setRequests(d.requests || []);
      }

      // Complaints
      const compRes = await fetch(`${API_BASE}/admin/privacy/complaints`, { headers });
      if (compRes.ok) {
        const d = await compRes.json();
        setComplaints(d.complaints || []);
      }

      // Incidents
      const incRes = await fetch(`${API_BASE}/admin/privacy/incidents`, { headers });
      if (incRes.ok) {
        const d = await incRes.json();
        setIncidents(d.incidents || []);
      }

      // Audit Logs
      const audRes = await fetch(`${API_BASE}/admin/privacy/audit-logs?limit=50`, { headers });
      if (audRes.ok) {
        const d = await audRes.json();
        setAuditLogs(d.auditLogs || []);
      }

      // Transparency data
      const invRes = await fetch(`${API_BASE}/privacy/inventory`);
      if (invRes.ok) {
        const d = await invRes.json();
        setInventory(d.dataInventory || []);
      }

      const venRes = await fetch(`${API_BASE}/privacy/vendor-inventory`);
      if (venRes.ok) {
        const d = await venRes.json();
        setVendors(d.subprocessors || []);
      }
    } catch (err: any) {
      console.error('Failed to load admin privacy data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAllData();
  }, [token]);

  // Request Actions
  const handleUpdateRequestStatus = async (id: string, status: string, rejectionReason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/privacy/requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, rejectionReason }),
      });

      if (!res.ok) throw new Error('Failed to update request');
      showMsg(`Request status updated to ${status}`);
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
      const res = await fetch(`${API_BASE}/admin/privacy/requests/${id}/execute-deletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      const res = await fetch(`${API_BASE}/admin/privacy/complaints/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      const res = await fetch(`${API_BASE}/admin/privacy/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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

      if (!res.ok) throw new Error('Failed to record incident');
      showMsg('Security incident logged and assigned to privacy response team.');
      setShowNewIncidentModal(false);
      setIncidentTitle('');
      setIncidentDescription('');
      setMitigationSteps('');
      await fetchAllData();
    } catch (err: any) {
      showMsg(err.message || 'Incident creation failed', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Retention Cleanup
  const handleTriggerRetentionCleanup = async () => {
    if (!confirm('Run automated privacy retention cleanup? This will purge expired OTPs and revoked tokens while preserving financial ledgers.')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/privacy/retention/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error('Failed to run retention cleanup');
      const data = await res.json();
      showMsg(`Retention cleanup completed: ${data.summary.expiredOtpsPurged} OTPs, ${data.summary.revokedTokensPurged} tokens purged.`);
      await fetchAllData();
    } catch (err: any) {
      showMsg(err.message || 'Cleanup failed', true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 border border-purple-200/60 px-3 py-0.5 text-xs font-bold text-purple-800 mb-2">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
            <span>Digital Personal Data Protection (DPDP) Compliance Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Privacy &amp; Data Compliance Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Statutory Data Subject Requests, Grievances, Data Breach Log, and Retention Operations.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleTriggerRetentionCleanup}
            disabled={actionLoading}
            className="px-4 py-2.5 rounded-2xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition shadow-sm flex items-center gap-2"
          >
            <Clock className="h-4 w-4" /> Run Retention Cleanup
          </button>

          <button
            onClick={fetchAllData}
            className="p-2.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition"
            title="Refresh All"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Data Requests</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{requests.length}</p>
          <span className="text-[10px] text-amber-600 font-bold">
            {requests.filter((r) => r.status === 'PENDING').length} Pending Review
          </span>
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Grievances Filed</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{complaints.length}</p>
          <span className="text-[10px] text-purple-600 font-bold">
            {complaints.filter((c) => c.status === 'RECEIVED').length} Awaiting Acknowledgement
          </span>
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Security Incidents</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{incidents.length}</p>
          <span className="text-[10px] text-rose-600 font-bold">
            {incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length} Active
          </span>
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Audit Records</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{auditLogs.length}</p>
          <span className="text-[10px] text-emerald-600 font-bold">Tamper-Evident Active</span>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-rose-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-2">
        {[
          { id: 'requests', label: 'Data Requests (DSAR)', count: requests.length },
          { id: 'complaints', label: 'Grievance Redressal', count: complaints.length },
          { id: 'incidents', label: 'Security Incidents', count: incidents.length },
          { id: 'audit', label: 'Privacy Audit Trail', count: auditLogs.length },
          { id: 'inventory', label: 'Data & Vendor Inventory', count: vendors.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                isActive ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DATA SUBJECT REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900">Data Subject Access &amp; Deletion Requests</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                <tr>
                  <th className="p-3">User Details</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Reason / Payload</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="p-3">
                      <p className="font-bold text-gray-900">
                        {r.user?.profile?.firstName} {r.user?.profile?.lastName}
                      </p>
                      <span className="text-[10px] text-gray-400">{r.user?.phone}</span>
                    </td>
                    <td className="p-3 font-bold text-purple-700">{r.type}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          r.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : r.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs truncate text-gray-600">
                      {r.reason || JSON.stringify(r.correctionData || r.requestedData || {})}
                    </td>
                    <td className="p-3 text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right space-x-2">
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateRequestStatus(r.id, 'VERIFIED')}
                            className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold hover:bg-purple-100"
                          >
                            Verify
                          </button>
                          {r.type === 'DATA_DELETION' ? (
                            <button
                              onClick={() => setShowDeletionModal(r)}
                              className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-sm"
                            >
                              Execute Erasure
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateRequestStatus(r.id, 'COMPLETED')}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                            >
                              Complete
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-black text-gray-900">Customer Privacy Grievances (Statutory 48h SLA)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                <tr>
                  <th className="p-3">Complainant</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Subject &amp; Details</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="p-3">
                      <p className="font-bold text-gray-900">{c.name}</p>
                      <span className="text-[10px] text-gray-400">{c.email}</span>
                    </td>
                    <td className="p-3 font-bold text-gray-800">{c.category}</td>
                    <td className="p-3 max-w-sm">
                      <p className="font-bold text-gray-900">{c.subject}</p>
                      <p className="text-gray-500 text-[11px] truncate">{c.description}</p>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          c.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {c.status !== 'RESOLVED' && (
                        <button
                          onClick={() => {
                            const res = prompt('Enter resolution notes for this grievance:');
                            if (res) handleResolveComplaint(c.id, res);
                          }}
                          className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DATA BREACH INCIDENTS */}
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
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                <tr>
                  <th className="p-3">Title &amp; Type</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Affected Records</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Detected At</th>
                  <th className="p-3">Mitigation / SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-gray-50/50">
                    <td className="p-3">
                      <p className="font-bold text-gray-900">{inc.incidentTitle}</p>
                      <span className="text-[10px] text-gray-400">{inc.incidentType}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          inc.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : inc.severity === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
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
                    <td className="p-3 text-gray-500">{new Date(inc.detectedAt).toLocaleString()}</td>
                    <td className="p-3 text-gray-600 max-w-xs truncate">{inc.mitigationSteps || inc.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-black text-gray-900">Privacy &amp; Data Operations Audit Trail</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor / Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">IP / Client</th>
                  <th className="p-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="p-3 text-gray-500">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="p-3">
                      <span className="font-bold text-gray-900">{a.actorRole || 'SYSTEM'}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-purple-700">{a.action}</td>
                    <td className="p-3 text-gray-800 font-medium">{a.entity}</td>
                    <td className="p-3 text-gray-400 font-mono text-[10px]">{a.ipAddress || 'Internal'}</td>
                    <td className="p-3 text-gray-500 max-w-xs truncate">{JSON.stringify(a.metadata || {})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: INVENTORY & VENDORS */}
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
                  <p className="text-gray-600 text-[11px]"><strong>Fields:</strong> {cat.fields.join(', ')}</p>
                  <p className="text-gray-500 text-[11px]"><strong>Basis:</strong> {cat.legalBasis}</p>
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
                  <p className="text-gray-600 text-[11px]"><strong>Service:</strong> {v.serviceCategory}</p>
                  <p className="text-gray-500 text-[11px]"><strong>Data Processed:</strong> {v.dataProcessed.join(', ')}</p>
                </div>
              ))}
            </div>
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
