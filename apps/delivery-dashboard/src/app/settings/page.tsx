'use client';

import React, { useState, useEffect } from 'react';
import { User, KeyRound, Lock, Camera, Trash2, Save, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function DeliverySettingsPage() {
  const { user, accessToken, setAuth, updateUser } = useDeliveryAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'passwords'>('profile');

  // User Profile State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Feedback & Loading
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      else if (user.name) setFirstName(user.name.split(' ')[0] || 'Courier');
      if (user.lastName) setLastName(user.lastName);
      else if (user.name) setLastName(user.name.split(' ').slice(1).join(' ') || '');
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

  // Avatar Upload Handlers
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showNotification('Invalid image type. Please upload JPEG, PNG, or WebP.', true);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Image size exceeds 5MB limit.', true);
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

      showNotification('Profile picture removed successfully');
    } catch (err: any) {
      showNotification(err.message || 'Failed to remove profile picture', true);
    } finally {
      setLoading(false);
    }
  };

  // Save User Profile Changes
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

      showNotification('Courier profile updated successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update profile', true);
    } finally {
      setLoading(false);
    }
  };

  // Change Account Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      showNotification('Please enter your current password.', true);
      return;
    }
    if (newPassword.length < 8) {
      showNotification('New password must be at least 8 characters long.', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match.', true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showNotification('Password updated successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to change password', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Courier Account Settings
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500">
          Manage profile photo, contact details &amp; login credentials
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3.5 text-xs font-bold text-rose-700 border border-rose-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-black whitespace-nowrap transition min-h-[40px] ${
            activeTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Courier Profile &amp; Avatar</span>
        </button>
        <button
          onClick={() => setActiveTab('passwords')}
          className={`flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-black whitespace-nowrap transition min-h-[40px] ${
            activeTab === 'passwords'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>Password Security</span>
        </button>
      </div>

      {/* TAB 1: COURIER PROFILE & AVATAR */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-gray-100 pb-4">
            <div className="relative shrink-0">
              <img
                src={
                  avatarPreview ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                }
                alt="Courier Avatar"
                className="h-24 w-24 rounded-full object-cover border-4 border-emerald-500 shadow-md"
              />
              <label
                htmlFor="delivery-avatar-upload"
                className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="delivery-avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div>
                <h3 className="text-sm sm:text-base font-black text-gray-900">Courier Profile Photo</h3>
                <p className="text-xs text-gray-500">Supports JPEG, PNG, or WebP up to 5MB.</p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <label
                  htmlFor="delivery-avatar-upload"
                  className="cursor-pointer rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition min-h-[36px] flex items-center"
                >
                  Upload New Photo
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-1.5 rounded-2xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition min-h-[36px]"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Registered Phone (Verified)</label>
            <input
              type="text"
              disabled
              value={user?.phone || '+919876500999'}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-500 cursor-not-allowed min-h-[44px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 disabled:opacity-50 transition min-h-[44px]"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      )}

      {/* TAB 2: PASSWORD SECURITY */}
      {activeTab === 'passwords' && (
        <form onSubmit={handleChangePassword} className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-black text-gray-900">Update Account Password</h2>
            <p className="text-xs text-gray-500">Change password for courier partner login</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 disabled:opacity-50 transition min-h-[44px]"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Updating Password...' : 'Update Password'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
