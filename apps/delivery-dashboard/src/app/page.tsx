'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Bike,
  CheckCircle2,
  Star,
  ArrowRight,
  Navigation,
  Power,
  Clock,
  MapPin,
  RefreshCw,
  Phone,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../stores/use-delivery-auth-store';
import { io } from 'socket.io-client';

const API_BASE = getApiBaseUrl();

export default function DeliveryDashboardPage() {
  const { user, accessToken } = useDeliveryAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [currentDelivery, setCurrentDelivery] = useState<any>(null);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [isTogglingDuty, setIsTogglingDuty] = useState(false);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

      try {
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        };
        
        // Fetch individually so one failure doesn't block the rest
        const fetchStats = fetch(`${API_BASE}/delivery/stats?_t=${Date.now()}`, { headers, cache: 'no-store' })
          .then(async r => {
            if (r.ok) {
              const text = await r.text();
              if (text) setStats(JSON.parse(text));
            }
          }).catch(console.error);

        const fetchCurrent = fetch(`${API_BASE}/delivery/current?_t=${Date.now()}`, { headers, cache: 'no-store' })
          .then(async r => {
            if (r.ok) {
              const text = await r.text();
              try {
                const parsed = text ? JSON.parse(text) : null;
                // If the backend wraps it in data (e.g. { data: {...} }), extract it
                const jobPayload = parsed?.data || parsed;
                setCurrentDelivery(jobPayload);
              } catch (e) {
                console.error("Failed to parse current delivery:", text);
                setCurrentDelivery(null);
              }
            } else {
              setCurrentDelivery(null);
            }
          }).catch(e => {
            console.error("Network error fetching current delivery:", e);
            setCurrentDelivery(null);
          });

        const fetchJobs = fetch(`${API_BASE}/delivery/jobs/available?_t=${Date.now()}`, { headers, cache: 'no-store' })
          .catch(() => fetch(`${API_BASE}/delivery/available?_t=${Date.now()}`, { headers, cache: 'no-store' }))
          .then(async r => {
            if (r && r.ok) {
              const text = await r.text();
              if (text) {
                const data = JSON.parse(text);
                setAvailableJobs(Array.isArray(data) ? data : data.jobs || []);
              }
            }
          }).catch(console.error);

        const fetchStatus = fetch(`${API_BASE}/delivery/me/status?_t=${Date.now()}`, { headers, cache: 'no-store' })
          .then(async r => {
            if (r.ok) {
              const text = await r.text();
              if (text) {
                const data = JSON.parse(text);
                setIsOnDuty(data.dutyStatus === 'ONLINE' || data.operationalStatus === 'ONLINE');
              }
            }
          }).catch(console.error);

        await Promise.all([fetchStats, fetchCurrent, fetchJobs, fetchStatus]);
      } catch (e) {
        console.error("fetchDashboardData top-level error:", e);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchDashboardData();

    const socketUrl = API_BASE.replace('/api/v1', '');
    const socket = io(`${socketUrl}/orders`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('joinDriver', { token: accessToken });
      socket.emit('joinAvailableDrivers');
      fetchDashboardData();
    });

    socket.on('job.available', () => fetchDashboardData());
    socket.on('order.status_updated', () => fetchDashboardData());

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  // Live GPS tracking when ON DUTY
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOnDuty || !accessToken || typeof window === 'undefined') return;

    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    let lastEmit = 0;
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        setLocationError(null);
        const { latitude, longitude } = pos.coords;
        const now = Date.now();
        // Send heartbeat every 10 seconds to not spam the server but keep it live
        if (now - lastEmit > 10000) {
          lastEmit = now;
          try {
            await fetch(`${API_BASE}/delivery/me/heartbeat`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ lat: latitude, lng: longitude }),
            });
          } catch (err) {
            console.error('GPS Heartbeat failed', err);
          }
        }
      },
      (err) => {
        setLocationError('Location permission is required to receive live delivery tracking.');
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnDuty, accessToken]);

  const toggleDuty = async () => {
    if (!accessToken || isTogglingDuty) return;
    setIsTogglingDuty(true);
    const newStatus = !isOnDuty;
    try {
      let res = await fetch(`${API_BASE}/delivery/duty/toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOnline: newStatus, status: newStatus ? 'ONLINE' : 'OFFLINE' }),
      });

      if (!res.ok && res.status !== 400 && res.status !== 403) {
        res = await fetch(`${API_BASE}/delivery/duty-status`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus ? 'ONLINE' : 'OFFLINE' }),
        });
      }

      if (res.ok) {
        setIsOnDuty(newStatus);
      } else {
        const errorData = await res.json().catch(() => null);
        alert(errorData?.message || 'Failed to change duty status. Please try again.');
      }
    } catch {
      alert('Network error. Could not connect to the server.');
    } finally {
      setIsTogglingDuty(false);
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    if (!accessToken) return;
    setAcceptingJobId(jobId);
    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${jobId}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        await fetchDashboardData();
      } else {
        alert('Unable to accept job. It may have been claimed.');
        await fetchDashboardData();
      }
    } catch {
      /* ignore */
    } finally {
      setAcceptingJobId(null);
    }
  };

  const [decliningJobId, setDecliningJobId] = useState<string | null>(null);

  const handleDeclineJob = async (jobId: string) => {
    if (!accessToken) return;
    if (
      !confirm(
        'Decline this delivery? This job will be removed from your list, but will remain available for other riders.',
      )
    )
      return;

    setDecliningJobId(jobId);
    try {
      const res = await fetch(`${API_BASE}/delivery/jobs/${jobId}/decline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Rider declined job' }),
      });

      if (res.ok) {
        setAvailableJobs((prev) => prev.filter((j) => j.id !== jobId));
      } else {
        alert('Failed to decline delivery.');
      }
    } catch {
      /* ignore */
    } finally {
      setDecliningJobId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Driver Duty Banner */}
      <div
        className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-md flex items-center justify-between transition ${
          isOnDuty
            ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
            : 'bg-gradient-to-r from-gray-700 to-gray-800'
        }`}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${isOnDuty ? 'bg-emerald-300 animate-pulse' : 'bg-gray-400'}`}
            />
            <span className="text-xs font-black uppercase tracking-wider">
              {isOnDuty ? 'YOU ARE ON DUTY (ONLINE)' : 'YOU ARE OFF DUTY (OFFLINE)'}
            </span>
          </div>
          <p className="text-[11px] text-white/80">
            {isOnDuty
              ? 'Receiving live delivery orders near your location'
              : 'Go online to start receiving order requests'}
          </p>
        </div>

        <button
          onClick={toggleDuty}
          disabled={isTogglingDuty || (isOnDuty && !!currentDelivery)}
          className={`flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-black transition min-h-[44px] shrink-0 ${
            isOnDuty && !!currentDelivery
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : isOnDuty
                ? 'bg-white text-emerald-800 hover:bg-emerald-50'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          <Power className="h-4 w-4" />
          <span>{isTogglingDuty ? '...' : isOnDuty ? 'GO OFFLINE' : 'GO ONLINE'}</span>
        </button>
      </div>

      {/* Location Error Banner */}
      {locationError && (
        <div className="rounded-2xl border-2 border-rose-500 bg-rose-50 p-4 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-800">
            <MapPin className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase">GPS Disconnected</p>
              <p className="text-[11px] font-bold opacity-90">{locationError}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-[10px] font-black uppercase text-rose-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ACTIVE DELIVERY IN PROGRESS BANNER (If job active) */}
      {currentDelivery && (
        <div className="rounded-2xl sm:rounded-3xl border-2 border-orange-500 bg-orange-50/50 p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-orange-200 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-600 animate-ping" />
              <span className="text-xs font-black text-orange-950 uppercase">
                ACTIVE DELIVERY IN PROGRESS
              </span>
            </div>
            <span className="rounded-xl bg-orange-600 px-2.5 py-0.5 text-[10px] font-black text-white uppercase">
              #{currentDelivery.orderNumber || currentDelivery.id?.slice(0, 8)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">
                Pickup Restaurant
              </span>
              <span className="font-black text-gray-900">
                {currentDelivery.restaurantName || 'Restaurant Kitchen'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">
                Customer Area
              </span>
              <span className="font-black text-gray-900">
                {currentDelivery.customerAddress || 'Customer Destination'}
              </span>
            </div>
          </div>

          <Link
            href="/current-delivery"
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-700 py-3 text-xs font-black text-white shadow-md shadow-orange-500/25 transition min-h-[44px]"
          >
            <Navigation className="h-4 w-4" />
            <span>Open Active Delivery Console &amp; OTP</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Daily Metrics: 2-col on Mobile, 4-col on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-400">TODAY EARNINGS</span>
            <DollarSign className="h-6 w-6 rounded-xl bg-emerald-50 p-1.5 text-emerald-600" />
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-gray-900">
            ₹{stats?.todayEarnings ?? 0}
          </h2>
          <span className="text-[10px] text-emerald-600 font-bold block">
            Settled to Bank Cycle
          </span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-400">COMPLETED TRIPS</span>
            <Bike className="h-6 w-6 rounded-xl bg-blue-50 p-1.5 text-blue-600" />
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-gray-900">
            {stats?.completedDeliveries ?? 0}
          </h2>
          <span className="text-[10px] text-gray-500 font-semibold block">
            Deliveries completed
          </span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-gray-400">ACCEPTANCE</span>
              <CheckCircle2 className="h-6 w-6 rounded-xl bg-purple-50 p-1.5 text-purple-600 shrink-0" />
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-gray-900 mt-1">
              {stats?.acceptanceRate !== null && stats?.acceptanceRate !== undefined
                ? `${stats.acceptanceRate}%`
                : 'N/A'}
            </h2>
          </div>
          <span
            className={`text-[10px] font-bold block mt-1 ${stats?.acceptanceRate !== null && stats?.acceptanceRate !== undefined ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            {stats?.acceptanceRate !== null && stats?.acceptanceRate !== undefined
              ? 'Target metrics'
              : 'No deliveries yet'}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-gray-400">RATING</span>
              <Star className="h-6 w-6 rounded-xl bg-amber-50 p-1.5 text-amber-500 shrink-0" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-1">
              {stats?.avgRating !== null && stats?.avgRating !== undefined
                ? `${stats.avgRating.toFixed(1)} ★`
                : 'No ratings yet'}
            </h2>
          </div>
          <span className="text-[9px] leading-tight text-gray-400 font-semibold block mt-1">
            {stats?.avgRating !== null && stats?.avgRating !== undefined
              ? 'Customer feedback'
              : 'Customer feedback will appear after completed deliveries'}
          </span>
        </div>
      </div>

      {/* Available Orders Section */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base md:text-lg font-black text-gray-900">
              Available Delivery Jobs ({availableJobs.length})
            </h2>
            <p className="text-[11px] text-gray-500">
              Orders ready for pickup in your operational zone
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 min-h-[36px]"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {availableJobs.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6">
            <Bike className="h-8 w-8 mx-auto text-gray-300 mb-1" />
            <p>No available delivery jobs in your area right now.</p>
            <p className="text-[10px] text-gray-400 mt-1">Keep your app open and stay online.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {availableJobs.map((job) => {
              const isAccepting = acceptingJobId === job.id;
              return (
                <div
                  key={job.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3 flex flex-col justify-between hover:border-emerald-300 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-black text-gray-900">
                        #{job.orderNumber || job.id.slice(0, 8)}
                      </span>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                        Payout: ₹{job.estimatedEarnings || job.deliveryFee || 65}
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold block uppercase">
                            Pickup
                          </span>
                          <span className="font-bold text-gray-900">
                            {job.restaurantName || 'Restaurant Kitchen'}
                          </span>
                          <span className="text-[11px] text-gray-500 block truncate">
                            {job.restaurantAddress}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold block uppercase">
                            Drop
                          </span>
                          <span className="font-bold text-gray-900">
                            {job.customerAddress || 'Customer Destination'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-gray-500">
                        Distance:{' '}
                        {job.distanceKm != null ? `${job.distanceKm} km` : 'Distance unavailable'}
                      </span>
                      {job.offeredAt && (
                        <span className="text-[10px] text-gray-400">
                          Offered{' '}
                          {Math.floor((Date.now() - new Date(job.offeredAt).getTime()) / 60000)}{' '}
                          mins ago
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleDeclineJob(job.id)}
                        disabled={isAccepting || decliningJobId === job.id || !isOnDuty}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-2xl bg-gray-100 hover:bg-gray-200 px-4 py-2.5 text-xs font-black text-gray-600 transition min-h-[44px]"
                      >
                        {decliningJobId === job.id ? 'Declining...' : 'DECLINE'}
                      </button>
                      <button
                        onClick={() => handleAcceptJob(job.id)}
                        disabled={isAccepting || decliningJobId === job.id || !isOnDuty}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 transition min-h-[44px]"
                      >
                        <span>{isAccepting ? 'Accepting...' : 'ACCEPT JOB'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
