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
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [statsRes, currentRes, jobsRes, statusRes] = await Promise.all([
        fetch(`${API_BASE}/delivery/stats`, { headers }),
        fetch(`${API_BASE}/delivery/current`, { headers }),
        fetch(`${API_BASE}/delivery/jobs/available`, { headers }).catch(() => fetch(`${API_BASE}/delivery/available`, { headers })),
        fetch(`${API_BASE}/delivery/me/status`, { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (currentRes.ok) {
        const currentData = await currentRes.json();
        setCurrentDelivery(currentData || null);
      }

      if (jobsRes && jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setAvailableJobs(Array.isArray(jobsData) ? jobsData : jobsData.jobs || []);
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setIsOnDuty(statusData.dutyStatus === 'ONLINE' || statusData.operationalStatus === 'ONLINE');
      }
    } catch {
      /* offline */
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
    });

    socket.on('job.available', () => fetchDashboardData());
    socket.on('driver.assigned', () => fetchDashboardData());
    socket.on('status.updated', () => fetchDashboardData());

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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
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
      }
    } catch {
      /* ignore */
    } finally {
      setAcceptingJobId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Driver Duty Banner */}
      <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-md flex items-center justify-between transition ${
        isOnDuty
          ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
          : 'bg-gradient-to-r from-gray-700 to-gray-800'
      }`}>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isOnDuty ? 'bg-emerald-300 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs font-black uppercase tracking-wider">
              {isOnDuty ? 'YOU ARE ON DUTY (ONLINE)' : 'YOU ARE OFF DUTY (OFFLINE)'}
            </span>
          </div>
          <p className="text-[11px] text-white/80">
            {isOnDuty ? 'Receiving live delivery orders near your location' : 'Go online to start receiving order requests'}
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
              <span className="text-xs font-black text-orange-950 uppercase">ACTIVE DELIVERY IN PROGRESS</span>
            </div>
            <span className="rounded-xl bg-orange-600 px-2.5 py-0.5 text-[10px] font-black text-white uppercase">
              #{currentDelivery.orderNumber || currentDelivery.id?.slice(0, 8)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Pickup Restaurant</span>
              <span className="font-black text-gray-900">{currentDelivery.restaurantName || 'Restaurant Kitchen'}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Customer Area</span>
              <span className="font-black text-gray-900">{currentDelivery.customerAddress || 'Customer Destination'}</span>
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
            ₹{stats?.todayEarnings ?? stats?.totalEarnings ?? 420}
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
            {stats?.completedDeliveries ?? stats?.totalTrips ?? 8}
          </h2>
          <span className="text-[10px] text-gray-500 font-semibold block">
            Deliveries completed
          </span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-400">ACCEPTANCE RATE</span>
            <CheckCircle2 className="h-6 w-6 rounded-xl bg-emerald-50 p-1.5 text-emerald-600" />
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-gray-900">
            {stats?.acceptanceRate ?? '96%'}
          </h2>
          <span className="text-[10px] text-emerald-600 font-bold block">
            High Reliability
          </span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-400">RATING</span>
            <Star className="h-6 w-6 rounded-xl bg-amber-50 p-1.5 text-amber-500" />
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-gray-900">
            {stats?.rating ?? '4.9'} ★
          </h2>
          <span className="text-[10px] text-gray-500 font-semibold block">
            Customer feedback
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
                          <span className="text-[10px] text-gray-400 font-bold block uppercase">Pickup</span>
                          <span className="font-bold text-gray-900">{job.restaurantName || 'Restaurant Kitchen'}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold block uppercase">Drop</span>
                          <span className="font-bold text-gray-900">{job.customerAddress || 'Customer Destination'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-gray-500">
                      Est. Distance: {job.distanceKm || '3.5'} km
                    </span>

                    <button
                      onClick={() => handleAcceptJob(job.id)}
                      disabled={isAccepting || !isOnDuty}
                      className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 transition min-h-[44px]"
                    >
                      <span>{isAccepting ? 'Accepting...' : 'ACCEPT JOB'}</span>
                    </button>
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
