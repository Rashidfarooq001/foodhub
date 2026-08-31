'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, Bike, ShieldCheck, MapPin } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'PAYOUT' | 'ORDER' | 'ACTIVE' | 'SYSTEM';
}

export default function DeliveryNotificationsPage() {
  const { accessToken, user } = useDeliveryAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const apiBase = getApiBaseUrl();
        const [histRes, currRes] = await Promise.all([
          fetch(`${apiBase}/delivery/history`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${apiBase}/delivery/current`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const list: NotificationItem[] = [];

        if (currRes.ok) {
          const curr = await currRes.json();
          if (curr && curr.id) {
            const num = curr.orderNumber || curr.order?.orderNumber || 'Active';
            const rest = curr.restaurantName || curr.restaurant?.name || 'Restaurant';
            list.push({
              id: `notif-curr-${curr.id}`,
              title: `Active Order: #${num}`,
              message: `You are currently assigned to deliver order #${num} from ${rest}.`,
              time: 'Just now',
              type: 'ACTIVE',
            });
          }
        }

        if (histRes.ok) {
          const history = await histRes.json();
          if (Array.isArray(history)) {
            history.slice(0, 10).forEach((item: any) => {
              const num = item.orderNumber || item.id?.slice(0, 8);
              const rest = item.restaurantName || 'Restaurant';
              const payout = item.riderPayout ? `₹${item.riderPayout}` : 'Earnings';
              const dateStr = item.deliveredAt
                ? new Date(item.deliveredAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                : 'Recently';

              list.push({
                id: `notif-hist-${item.id}`,
                title: `Order #${num} Completed (${payout})`,
                message: `Successfully delivered from ${rest}. Payout added to your earnings balance.`,
                time: dateStr,
                type: 'PAYOUT',
              });
            });
          }
        }

        if (user) {
          list.push({
            id: 'notif-system-welcome',
            title: 'Courier Partner Connected',
            message: 'Your delivery partner account is active and connected to the live dispatch system.',
            time: 'System',
            type: 'SYSTEM',
          });
        }

        setNotifications(list);
      } catch (err) {
        console.error('Failed to load notifications', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [accessToken, user]);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Courier Notifications &amp; Alerts
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500">
          Live job broadcast notifications, order assignments &amp; payout deposits
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center space-y-3">
          <Bell className="mx-auto h-10 w-10 text-gray-300" />
          <p className="text-base font-bold text-gray-700">No notifications yet</p>
          <p className="text-xs text-gray-400">You will receive notifications here when jobs are assigned or completed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-3 rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  n.type === 'ACTIVE'
                    ? 'bg-amber-100 text-amber-700'
                    : n.type === 'PAYOUT'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {n.type === 'ACTIVE' ? (
                  <Bike className="h-5 w-5" />
                ) : n.type === 'PAYOUT' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-gray-900">{n.title}</h4>
                  <span className="text-[10px] text-gray-400 font-medium shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
