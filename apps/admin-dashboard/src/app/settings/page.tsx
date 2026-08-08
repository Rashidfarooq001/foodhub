'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Key,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function AdminAccountSettingsPage() {
  const { user, accessToken, updateUser } = useAdminAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'passwords' | 'account'>('profile');

  // Profile State
  const [firstName, setFirstName] = useState(user?.firstName || 'Rashid');
  const [lastName, setLastName] = useState(user?.lastName || 'Reshi');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatarUrl ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  );

  // Two-Password Change State
  const [newPassword1, setNewPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');

  // Feedback & Loading State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
      if (user.avatarUrl) setAvatarPreview(user.avatarUrl);
    }
  }, [user]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg(null);
    } else {
      setSuccessMsg(msg);
      setErrorMsg(null);
    }
    setTimeout(() => {
      setErrorMsg(null);
      setSuccessMsg(null);
    }, 4000);
  };

  // Profile Picture Upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showNotification('Invalid file type. Please upload JPEG, PNG, or WebP.', true);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification('File size exceeds 5MB limit.', true);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setAvatarPreview(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ avatarUrl: null }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to remove avatar');
      }

      updateUser({ avatarUrl: undefined });
      showNotification('Profile picture removed successfully');
    } catch (err: any) {
      showNotification(err.message || 'Failed to remove profile picture', true);
    } finally {
      setLoading(false);
    }
  };

  // Save Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      showNotification('First name is required', true);
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatarUrl: avatarPreview || null,
      };

      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      const updatedProfile = data?.profile;
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      updateUser({
        firstName: updatedProfile?.firstName || firstName.trim(),
        lastName: updatedProfile?.lastName || lastName.trim(),
        name: fullName,
        avatarUrl: updatedProfile?.avatarUrl ?? (avatarPreview || undefined),
      });

      showNotification('Admin profile updated successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update profile', true);
    } finally {
      setLoading(false);
    }
  };

  // Save Two-Password Changes
  const handleSaveTwoPasswords = async (e: React.FormEvent) => {
    e.preventDefault();

    const p1 = newPassword1.trim();
    const p2 = newPassword2.trim();

    if (!p1 && !p2) {
      showNotification('Please enter a new Password 1 or Password 2 to update.', true);
      return;
    }

    if (p1 && !/^\d{16}$/.test(p1)) {
      showNotification('Password 1 must be exactly 16 numeric digits.', true);
      return;
    }
    if (p2 && !/^\d{8}$/.test(p2)) {
      showNotification('Password 2 must be exactly 8 numeric digits.', true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/admin/change-passwords`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          ...(p1 ? { newPassword1: p1 } : {}),
          ...(p2 ? { newPassword2: p2 } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update admin passwords');
      }

      setNewPassword1('');
      setNewPassword2('');
      showNotification('Admin passwords updated successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update admin passwords', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-gray-900">Admin Account Settings</h1>
            <span className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1 text-[10px] font-black uppercase text-white shadow-sm">
              {user?.role || 'SUPER_ADMIN'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage your administrator profile picture, display name, and two-password credentials
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-700 border border-rose-200 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
        {[
          { id: 'profile', label: 'Profile & Avatar', icon: User },
          { id: 'passwords', label: 'Password 1 & Password 2', icon: Key },
          { id: 'account', label: 'Security & Role Details', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition min-h-[44px] ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-100'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROFILE PICTURE & NAME */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Administrator Profile</h2>
            <p className="text-xs text-gray-500">Update your public display name and avatar picture</p>
          </div>

          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-gray-100 pb-8">
            <div className="relative shrink-0">
              <img
                src={
                  avatarPreview ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                }
                alt="Admin Avatar Preview"
                className="h-28 w-28 rounded-full object-cover border-4 border-purple-600 shadow-md"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition hover:bg-purple-700"
                title="Change Avatar"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <div>
                <h3 className="text-base font-bold text-gray-900">Profile Picture</h3>
                <p className="text-xs text-gray-500">
                  JPEG, PNG, or WebP format up to 5MB. Rendered in dashboard headers.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer rounded-2xl bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
                >
                  Upload New Photo
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-1.5 rounded-2xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove Picture
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name Details */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-2xl bg-purple-600 px-7 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-purple-700 disabled:opacity-50 transition"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: TWO-PASSWORD MANAGEMENT */}
      {activeTab === 'passwords' && (
        <form onSubmit={handleSaveTwoPasswords} className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Two-Password Credentials</h2>
            <p className="text-xs text-gray-500">
              Update Password 1 (16 numeric digits) or Password 2 (8 numeric digits). Existing passwords are never exposed.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                New Password 1 <span className="text-purple-600 font-bold">(16 Numeric Digits)</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  maxLength={16}
                  value={newPassword1}
                  onChange={(e) => setNewPassword1(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter new 16-digit Password 1"
                  className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-mono font-bold tracking-widest text-gray-900 focus:border-purple-600 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                Length: {newPassword1.length}/16 digits
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                New Password 2 <span className="text-purple-600 font-bold">(8 Numeric Digits)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  maxLength={8}
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter new 8-digit Password 2"
                  className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-mono font-bold tracking-widest text-gray-900 focus:border-purple-600 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                Length: {newPassword2.length}/8 digits
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-2xl bg-purple-600 px-7 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-purple-700 disabled:opacity-50 transition"
            >
              <Key className="h-4 w-4" />
              <span>{loading ? 'Updating Passwords...' : 'Save New Admin Passwords'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: ACCOUNT & ROLE SUMMARY */}
      {activeTab === 'account' && (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Security & Credentials Summary</h2>
            <p className="text-xs text-gray-500">Read-only account metadata and platform privileges</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account ID</span>
              <p className="text-xs font-mono font-bold text-gray-900 truncate">{user?.id || 'admin-uuid'}</p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4 space-y-1">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Platform Role</span>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600 shrink-0" />
                <p className="text-xs font-black text-purple-900">{user?.role || 'SUPER_ADMIN'}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-1">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Account Status</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-xs font-black text-emerald-900">ACTIVE & VERIFIED</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password 1</span>
              <p className="text-xs font-black text-gray-900">•••••••••••••••• (16 Digits)</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password 2</span>
              <p className="text-xs font-black text-gray-900">•••••••• (8 Digits)</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Auth Scheme</span>
              <p className="text-xs font-bold text-purple-700">Two-Password Hashing</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-xs font-bold text-indigo-900">
            <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
            <span>Protected by FoodHub Two-Password Authentication &amp; 256-Bit SSL JWT Session Management</span>
          </div>
        </div>
      )}
    </div>
  );
}
