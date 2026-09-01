'use client';

import React from 'react';
import { useSettingsStore } from '../../stores/use-settings-store';
import { Settings, Bell, Leaf, Moon } from 'lucide-react';

export default function SettingsPage() {
  const { isVegOnly, toggleVegOnly, pushEnabled, togglePush, smsEnabled, toggleSms } =
    useSettingsStore();

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-4 lg:px-5 space-y-5">
      <div>
        <h1 className="text-3xl font-black text-gray-900">App Settings</h1>
        <p className="text-xs text-gray-500">
          Configure dietary preferences, alerts & notifications
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
        {/* Veg Only Toggle */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Pure Veg Mode</h4>
              <p className="text-xs text-gray-500">
                Only show 100% vegetarian restaurants and dishes
              </p>
            </div>
          </div>
          <button
            onClick={toggleVegOnly}
            className={`h-6 w-11 rounded-full p-1 transition ${
              isVegOnly ? 'bg-emerald-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`h-4 w-4 rounded-full bg-white transition ${
                isVegOnly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Push Notifications</h4>
              <p className="text-xs text-gray-500">
                Get live order tracking & dispatch updates on your browser
              </p>
            </div>
          </div>
          <button
            onClick={togglePush}
            className={`h-6 w-11 rounded-full p-1 transition ${
              pushEnabled ? 'bg-orange-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`h-4 w-4 rounded-full bg-white transition ${
                pushEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* SMS Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">SMS Alerts</h4>
              <p className="text-xs text-gray-500">
                Receive delivery OTP and receipt updates over SMS
              </p>
            </div>
          </div>
          <button
            onClick={toggleSms}
            className={`h-6 w-11 rounded-full p-1 transition ${
              smsEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`h-4 w-4 rounded-full bg-white transition ${
                smsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
