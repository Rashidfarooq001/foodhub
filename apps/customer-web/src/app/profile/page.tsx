'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Phone, Mail, Camera, Save, CheckCircle2, AlertCircle, Trash2, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function ProfilePage() {
  const { user, accessToken, setAuth, updateUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form States
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
      if (user.email) setEmail(user.email);
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
      showNotification('Invalid image format. Please upload JPEG, PNG, or WebP.', true);
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
    setIsLoading(true);

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
      setIsLoading(false);
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      showNotification('First name is required', true);
      return;
    }

    setIsLoading(true);
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
      updateUser({
        firstName: updatedProfile?.firstName || firstName.trim(),
        lastName: updatedProfile?.lastName || lastName.trim(),
        email: email.trim(),
        avatarUrl: updatedProfile?.avatarUrl ?? (avatarPreview || undefined),
      });

      showNotification('Profile details updated successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update profile', true);
    } finally {
      setIsLoading(false);
    }
  };

  // Change Password
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

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  // Initials helper
  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  return (
    <div className="mx-auto max-w-2xl px-4 py-3 sm:px-4 lg:px-5 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500">Manage your personal details and password</p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-700 border border-rose-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 pb-3">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
            activeTab === 'profile'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <User className="h-4 w-4" /> Profile
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
            activeTab === 'security'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <KeyRound className="h-4 w-4" /> Security
        </button>
        <Link
          href="/privacy"
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100 transition ml-auto"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Privacy &amp; Data Center
        </Link>
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
            <div className="relative shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile Avatar"
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-orange-500 shadow-sm"
                />
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-orange-200 bg-orange-100 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black text-orange-600">{initials}</span>
                </div>
              )}
              <label
                htmlFor="customer-avatar-upload"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-orange-600 text-white shadow hover:bg-orange-700 transition"
              >
                <Camera className="h-3 w-3" />
                <input
                  id="customer-avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-2 text-left">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Profile Photo</h3>
                <p className="text-[10px] sm:text-xs text-gray-500">JPG, PNG up to 5MB.</p>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2">
                <label
                  htmlFor="customer-avatar-upload"
                  className="cursor-pointer rounded-xl bg-orange-50 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-orange-700 border border-orange-200 hover:bg-orange-100 transition"
                >
                  Change
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Registered Phone (Verified)</label>
            <input
              type="text"
              disabled
              value={user?.phone || '+919876543210'}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-500 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-2xl bg-orange-600 px-4 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-orange-700 disabled:opacity-50 transition"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      )}

      {/* TAB 2: SECURITY & PASSWORD CHANGE */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Change Account Password</h2>
            <p className="text-xs text-gray-500">Update your login password credentials</p>
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
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
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
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
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
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-2xl bg-orange-600 px-4 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-orange-700 disabled:opacity-50 transition"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Updating Password...' : 'Update Password'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
