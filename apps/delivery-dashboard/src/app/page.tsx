'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DeliveryJob, DriverStats } from '../data/delivery-mock-data';
import { DollarSign, Bike, CheckCircle2, Star, ArrowRight, Navigation, Power, AlertTriangle, Clock } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { io } from 'socket.io-client';

const API_BASE = getApiBaseUrl();

export default function DeliveryDashboardPage() {
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [currentDelivery, setCurrentDelivery] = useState<DeliveryJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [me, setMe] = useState<any>(null);

  // Presence State
  const [operationalStatus, setOperationalStatus] = useState<string>('OFFLINE');
  const [dutyStatus, setDutyStatus] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [onlineSince, setOnlineSince] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const getAccessToken = () => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('foodhub-delivery-auth');
    if (!token) return null;
    try {
      const parsed = JSON.parse(token);
      return parsed.state?.accessToken || parsed.accessToken || null;
    } catch {
      return null;
    }
  };

  const fetchStatus = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/delivery/me/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOperationalStatus(data.operationalStatus);
        setDutyStatus(data.dutyStatus);
        setOnlineSince(data.onlineSince);
      }
    } catch {
      /* offline */
    }
  };

  useEffect(() => {
    const token = getAccessToken();

    const fetchAll = async () => {
      try {
        if (token) {
          const meRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            setMe(meData);
          }
        }

        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const [statsRes, deliveryRes] = await Promise.all([
          fetch(`${API_BASE}/delivery/stats`, { headers }),
          fetch(`${API_BASE}/delivery/current`, { headers }),
        ]);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
        if (deliveryRes.ok) {
          const data = await deliveryRes.json();
          setCurrentDelivery(data ?? null);
        }
      } catch {
        // Backend offline
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
    fetchStatus();

    // Socket.IO Real-time Multi-Tab / Fleet Presence Sync
    let socket: any = null;
    try {
      const socketUrl = API_BASE.replace('/api/v1', '');
      socket = io(`${socketUrl}/orders`, {
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        if (me?.driver?.id) {
          socket.emit('joinOrder', { orderId: `driver:${me.driver.id}` });
        }
      });

      socket.on('driver.status_changed', (payload: any) => {
        if (!me?.driver?.id || payload?.driverId === me.driver.id) {
          if (payload?.dutyStatus) {
            setDutyStatus(payload.dutyStatus);
            setOperationalStatus(payload.operationalStatus || payload.dutyStatus);
          }
        }
      });
    } catch {
      /* socket offline */
    }

    // Setup 30s Heartbeat loop when online
    const heartbeatInterval = setInterval(() => {
      if (token && dutyStatus === 'ONLINE') {
        fetch(`${API_BASE}/delivery/me/heartbeat`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      if (socket) socket.disconnect();
    };
  }, [dutyStatus, me?.driver?.id]);

  const handleToggleDutyStatus = async () => {
    const token = getAccessToken();
    if (!token) return;
    setIsTogglingStatus(true);
    setStatusMessage(null);

    const targetAction = dutyStatus === 'ONLINE' ? 'go-offline' : 'go-online';

    try {
      const res = await fetch(`${API_BASE}/delivery/me/${targetAction}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setStatusMessage(errData.message || 'Failed to update delivery availability status.');
        return;
      }

      const data = await res.json();
      setDutyStatus(data.dutyStatus);
      setOperationalStatus(data.operationalStatus);
      setStatusMessage(data.message);
    } catch {
      setStatusMessage('Network error. Unable to reach delivery backend.');
    } finally {
      setIsTogglingStatus(false);
      setTimeout(() => setStatusMessage(null), 5000);
      fetchStatus();
    }
  };

  const kpi = {
    todayEarnings: stats?.todayEarnings ?? 0,
    todayDeliveries: stats?.todayDeliveries ?? 0,
    acceptanceRate: stats?.acceptanceRate ?? 0,
    avgRating: stats?.avgRating ?? 0,
    totalRatings: stats?.totalRatings ?? 0,
  };

  const isUnderReview = me?.driver && me.driver.isApproved === false;

  return (
    <div className="space-y-8">
      {/* Alert Banner */}
      {statusMessage && (
        <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs font-bold text-amber-900 shadow-lg animate-bounce">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Prominent Delivery Availability Switch Banner */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white font-black transition-all ${
              operationalStatus === 'BUSY'
                ? 'bg-amber-500 shadow-lg shadow-amber-500/20'
                : dutyStatus === 'ONLINE'
                ? 'bg-emerald-600 shadow-lg shadow-emerald-500/20'
                : 'bg-gray-700'
            }`}
          >
            <Power className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  operationalStatus === 'BUSY'
                    ? 'bg-amber-500 animate-pulse'
                    : dutyStatus === 'ONLINE'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-gray-400'
                }`}
              />
              <h2 className="text-xl font-black text-gray-900">
                {operationalStatus === 'BUSY'
                  ? 'BUSY — DELIVERING ORDER'
                  : dutyStatus === 'ONLINE'
                  ? '🟢 ONLINE — AVAILABLE FOR DELIVERIES'
                  : '⚫ OFFLINE — UNAVAILABLE'}
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {operationalStatus === 'BUSY'
                ? 'Complete your active delivery before changing duty status.'
                : dutyStatus === 'ONLINE'
                ? 'You are visible to nearby restaurants and eligible for delivery dispatches.'
                : 'You are currently offline. Turn on switch to receive order dispatches.'}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          disabled={isTogglingStatus || operationalStatus === 'BUSY' || isUnderReview}
          onClick={handleToggleDutyStatus}
          className={`flex items-center gap-3 rounded-2xl px-6 py-3.5 text-xs font-black transition-all shadow-md ${
            dutyStatus === 'ONLINE'
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          } disabled:opacity-50 min-w-[160px] justify-center`}
        >
          {isTogglingStatus
            ? 'Updating...'
            : operationalStatus === 'BUSY'
            ? 'BUSY ON TRIP'
            : dutyStatus === 'ONLINE'
            ? 'GO OFFLINE'
            : 'GO ONLINE NOW'}
        </button>
      </div>

      {isUnderReview && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900 shadow-sm flex items-center justify-between">
          <div>
            <span className="font-black text-amber-800 uppercase tracking-wider text-[10px] block">Application Status</span>
            <span>Your delivery partner application is currently under admin review (isApproved=false).</span>
          </div>
          <span className="rounded-xl bg-amber-200 px-3 py-1 text-[11px] font-black text-amber-900">UNDER REVIEW</span>
        </div>
      )}

      {/* Driver Welcome Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Courier Performance Overview</h1>
          <p className="text-xs text-gray-500">Track daily trips, earnings payouts, acceptance rates &amp; active deliveries</p>
        </div>

        <Link
          href="/current-delivery"
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
        >
          <Navigation className="h-4 w-4" /> View Active Delivery Navigation
        </Link>
      </div>

      {/* Driver Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>TODAY&apos;S EARNINGS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-emerald-600">₹{kpi.todayEarnings}</h3>
          )}
          <p className="text-[10px] text-gray-400 font-bold">Includes base pay + tips</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>COMPLETED TRIPS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Bike className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-gray-900">{kpi.todayDeliveries} Orders</h3>
          )}
          <p className="text-[10px] text-emerald-600 font-bold">100% On-Time Dispatch Rate</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>ACCEPTANCE RATE</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-gray-900">{kpi.acceptanceRate}%</h3>
          )}
          <p className="text-[10px] text-teal-600 font-bold">Qualifies for ₹500 Weekly Incentive</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>RATING SCORE</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Star className="h-4 w-4 fill-amber-500" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-16 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-gray-900">{kpi.avgRating}/5</h3>
          )}
          <p className="text-[10px] text-gray-400 font-bold">Based on {kpi.totalRatings} ratings</p>
        </div>
      </div>

      {/* Active Trip Banner Card */}
      {!isLoading && currentDelivery && (
        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase backdrop-blur-md">
                ACTIVE TRIP #{currentDelivery.orderNumber}
              </span>
              <span className="text-xs font-bold text-emerald-200">
                Payout: ₹{currentDelivery.estimatedEarnings}
              </span>
            </div>
            <span className="text-xs font-bold text-white bg-emerald-900/50 px-3 py-1 rounded-full">
              STATUS: {currentDelivery.status}
            </span>
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-black">{currentDelivery.restaurantName} ➔ {currentDelivery.customerName}</h3>
              <p className="text-xs text-emerald-100">{currentDelivery.customerAddress}</p>
            </div>

            <Link
              href="/current-delivery"
              className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-black text-emerald-800 shadow-xl hover:bg-emerald-50"
            >
              Open GPS Navigation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
