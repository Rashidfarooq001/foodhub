const fs = require('fs');
const content = `
'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';

const API_BASE = getApiBaseUrl();

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  status: 'PENDING' | 'READ' | 'ACTIONED';
  createdAt: string;
}

export default function DeliveryNotificationsPage() {
  const { accessToken, user } = useDeliveryAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(\`\${API_BASE}/delivery/notifications\`, {
        headers: { Authorization: \`Bearer \${accessToken}\` },
      });

      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [accessToken, user]);

  const markRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ' } : n))
      );
      await fetch(\`\${API_BASE}/delivery/notifications/\${id}/read\`, {
        method: 'PATCH',
        headers: { Authorization: \`Bearer \${accessToken}\` },
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Courier Notifications &amp; Alerts
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Live job broadcast notifications, order assignments &amp; payout deposits
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 min-h-[40px]"
        >
          <RefreshCw className={\`h-3.5 w-3.5 \${isLoading ? 'animate-spin' : ''}\`} />
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-base font-bold text-gray-700">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              You will receive notifications here when jobs are assigned or completed.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.status !== 'READ') markRead(n.id);
              }}
              className={\`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-colors cursor-pointer \${
                n.status !== 'READ'
                  ? 'bg-emerald-50/30 border-emerald-100'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }\`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={\`mt-1 p-2 rounded-xl \${
                    n.status !== 'READ' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }\`}
                >
                  {n.status !== 'READ' ? (
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h3
                      className={\`text-sm sm:text-base font-bold \${
                        n.status !== 'READ' ? 'text-gray-900' : 'text-gray-700'
                      }\`}
                    >
                      {n.title}
                    </h3>
                    <span className="text-[10px] sm:text-xs font-medium text-gray-400 flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('apps/delivery-dashboard/src/app/notifications/page.tsx', content);
