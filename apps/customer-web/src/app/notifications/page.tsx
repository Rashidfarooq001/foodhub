'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useAuthStore } from '../../stores/use-auth-store';
import Link from 'next/link';

const API_BASE = getApiBaseUrl();

interface NotificationItem {
  id: string;
  orderId?: string;
  orderNumber?: string;
  title: string;
  message: string;
  time: string;
  timestamp?: number;
  type:
    | 'PLACED'
    | 'ACCEPTED'
    | 'PREPARING'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'SECURITY';
  isRead: boolean;
}

export default function NotificationsPage() {
  const { isAuthenticated, accessToken, user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated || !accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch user's orders and real notifications concurrently
        const [ordersRes, notificationsRes] = await Promise.all([
          fetch(`${API_BASE}/orders`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${API_BASE}/notifications`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const list: NotificationItem[] = [];

        // 1. Process Orders
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const orders = Array.isArray(ordersData) ? ordersData : (ordersData.orders ?? []);

          orders.slice(0, 15).forEach((o: any) => {
            const num = o.orderNumber || o.id.slice(0, 8);
            const restName = o.restaurant?.name || 'Restaurant';
            const dateObj = new Date(o.createdAt || o.placedAt || Date.now());
            const dateStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (o.status === 'DELIVERED') {
              list.push({
                id: `notif-${o.id}-del`,
                orderId: o.id,
                orderNumber: num,
                title: `Order #${num} Delivered`,
                message: `Your meal from ${restName} has been delivered successfully. Enjoy your food!`,
                time: dateStr,
                timestamp: dateObj.getTime(),
                type: 'DELIVERED',
                isRead: true,
              });
            } else if (o.status === 'OUT_FOR_DELIVERY' || o.status === 'RIDER_PICKED_UP') {
              list.push({
                id: `notif-${o.id}-ofd`,
                orderId: o.id,
                orderNumber: num,
                title: `Order #${num} Out For Delivery`,
                message: `Delivery partner is heading to your delivery location from ${restName}.`,
                time: dateStr,
                timestamp: dateObj.getTime(),
                type: 'OUT_FOR_DELIVERY',
                isRead: false,
              });
            } else if (o.status === 'PREPARING' || o.status === 'READY_FOR_PICKUP') {
              list.push({
                id: `notif-${o.id}-prep`,
                orderId: o.id,
                orderNumber: num,
                title: `Order #${num} is Being Prepared`,
                message: `${restName} is freshly preparing your dishes right now.`,
                time: dateStr,
                timestamp: dateObj.getTime(),
                type: 'PREPARING',
                isRead: false,
              });
            } else if (o.status === 'CANCELLED') {
              list.push({
                id: `notif-${o.id}-can`,
                orderId: o.id,
                orderNumber: num,
                title: `Order #${num} Cancelled`,
                message: `Order #${num} was cancelled. Refund/status details are available in order history.`,
                time: dateStr,
                timestamp: dateObj.getTime(),
                type: 'CANCELLED',
                isRead: true,
              });
            } else {
              list.push({
                id: `notif-${o.id}-plc`,
                orderId: o.id,
                orderNumber: num,
                title: `Order #${num} Placed`,
                message: `Order received by ${restName} for ?${o.totalAmount || o.customerTotal}.`,
                time: dateStr,
                timestamp: dateObj.getTime(),
                type: 'PLACED',
                isRead: false,
              });
            }
          });
        }

        // 2. Process Real Notifications (from Broadcasts)
        if (notificationsRes.ok) {
          const notifsData = await notificationsRes.json();
          const notifs = Array.isArray(notifsData) ? notifsData : [];
          notifs.forEach((n: any) => {
            const dateObj = new Date(n.createdAt);
            const dateStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            list.push({
              id: n.id,
              title: n.title,
              message: n.message,
              time: dateStr,
              timestamp: dateObj.getTime(),
              type: 'SYSTEM',
              isRead: n.status === 'READ',
            });
          });
        }

        // Add account security notification
        if (user) {
          list.push({
            id: 'notif-security-welcome',
            title: 'Account Protected',
            message: 'Your Zayka Food account is secured with verified device session encryption.',
            time: 'Recent',
            timestamp: 0, // Always at bottom
            type: 'SECURITY',
            isRead: true,
          });
        }

        // Sort by newest first
        list.sort((a, b) => b.timestamp - a.timestamp);

        setNotifications(list);
      } catch (err) {
        console.error('Failed to load notifications', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, accessToken, user]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-4 lg:px-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Notifications</h1>
            <p className="text-xs text-gray-500">Live order status updates & account alerts</p>
          </div>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
          >
            Mark all as read
          </button>
        )}
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
          <p className="text-base font-bold text-gray-700">You&apos;re all caught up</p>
          <p className="text-xs text-gray-400">
            You don&apos;t have any unread notifications right now.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isDelivered = n.type === 'DELIVERED';
            const isOfd = n.type === 'OUT_FOR_DELIVERY';
            const isCancelled = n.type === 'CANCELLED';
            const isSecurity = n.type === 'SECURITY';
            const isSystem = n.type === 'SYSTEM';

            const Icon = isDelivered
              ? CheckCircle2
              : isOfd
                ? Truck
                : isCancelled
                  ? XCircle
                  : isSecurity
                    ? ShieldCheck
                    : isSystem
                      ? Bell
                      : Clock;

            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 rounded-2xl border p-4 transition shadow-xs ${
                  n.isRead
                    ? 'border-gray-100 bg-white'
                    : 'border-rose-100 bg-rose-50/40 ring-1 ring-rose-200/50'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    isDelivered
                      ? 'bg-emerald-100 text-emerald-600'
                      : isOfd
                        ? 'bg-rose-100 text-rose-600'
                        : isCancelled
                          ? 'bg-rose-100 text-rose-600'
                          : isSecurity
                            ? 'bg-blue-100 text-blue-600'
                            : isSystem
                              ? 'bg-purple-100 text-purple-600'
                              : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>

                  {n.orderId && (
                    <div className="pt-1">
                      <Link
                        href={`/orders/${n.orderId}/track`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                      >
                        Track Order <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
