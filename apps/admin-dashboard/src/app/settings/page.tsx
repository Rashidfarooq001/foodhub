'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Key,
  Smartphone,
  Mail,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function AdminAccountSettingsPage() {
  const { user, accessToken, updateUser, logout } = useAdminAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'phone' | 'account'>('profile');

  // Profile State
  const [firstName, setFirstName] = useState(user?.firstName || 'Rashid');
  const [lastName, setLastName] = useState(user?.lastName || 'Reshi');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatarUrl ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Email State
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [newEmail, setNewEmail] = useState(user?.email || '');

  // Phone Change State
  const [currentPasswordForPhone, setCurrentPasswordForPhone] = useState('');
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [phoneStep, setPhoneStep] = useState<'INPUT' | 'VERIFY_OTP'>('INPUT');
  const [phoneOtp, setPhoneOtp] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Feedback & Loading State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
      if (user.email) setNewEmail(user.email);
      if (user.phone) setNewPhone(user.phone);
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

  // 1. Handle Profile Picture File Selection
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

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove Avatar
  const handleRemoveAvatar = async () => {
    setAvatarFile(null);
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

  // Save Profile Details (Name & Avatar)
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
      };
      if (avatarPreview) {
        payload.avatarUrl = avatarPreview;
      }

      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update profile');
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: fullName,
        ...(avatarPreview ? { avatarUrl: avatarPreview } : {}),
      });

      showNotification('Admin profile updated successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update profile', true);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showNotification('Current password is required', true);
      return;
    }
    if (newPassword.length < 8) {
      showNotification('New password must be at least 8 characters long', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match', true);
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

  // 3. Handle Email Change
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPasswordForEmail) {
      showNotification('Current password is required to change email', true);
      return;
    }
    if (!newEmail || !newEmail.includes('@')) {
      showNotification('Please enter a valid email address', true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: currentPasswordForEmail,
          newEmail: newEmail.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to change email address');
      }

      setCurrentPasswordForEmail('');
      updateUser({ email: data.user?.email || newEmail.trim() });
      showNotification('Email address updated successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to change email', true);
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Phone Change — Step 1: Request OTP
  const handleRequestPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPasswordForPhone) {
      showNotification('Current password is required to change phone number', true);
      return;
    }
    const cleanDigits = newPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      showNotification('Please enter a valid 10-digit mobile number', true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-phone/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: currentPasswordForPhone,
          newPhone: cleanDigits,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to request OTP for phone change');
      }

      setPhoneStep('VERIFY_OTP');
      showNotification(`OTP sent to +91${cleanDigits}`);
    } catch (err: any) {
      showNotification(err.message || 'Failed to request OTP', true);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Save Phone
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtp || phoneOtp.length < 4) {
      showNotification('Please enter the complete 4-digit OTP code', true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-phone/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          newPhone,
          otp: phoneOtp,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Phone OTP verification failed');
      }

      const updatedPhone = data.user?.phone || newPhone;
      updateUser({ phone: updatedPhone });
      setPhoneStep('INPUT');
      setCurrentPasswordForPhone('');
      setPhoneOtp('');
      showNotification('Phone number updated successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update phone number', true);
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
            Manage your administrator profile, security credentials, registered phone, and authentication details
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-700 border border-rose-200 shadow-sm animate-shake">
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
          { id: 'security', label: 'Password & Email', icon: Key },
          { id: 'phone', label: 'Phone & 2FA OTP', icon: Smartphone },
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

      {/* TAB 2: SECURITY & EMAIL / PASSWORD */}
      {activeTab === 'security' && (
        <div className="space-y-8">
          {/* Change Email Card */}
          <form onSubmit={handleChangeEmail} className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Registered Email Address</h2>
              <p className="text-xs text-gray-500">Update your primary admin notification & login email</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">New Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="admin@foodhub.com"
                    className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirm Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={currentPasswordForEmail}
                    onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-2xl bg-purple-600 px-7 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-purple-700 disabled:opacity-50 transition"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Updating Email...' : 'Update Email Address'}</span>
              </button>
            </div>
          </form>

          {/* Change Password Card */}
          <form onSubmit={handleChangePassword} className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Change Admin Password</h2>
              <p className="text-xs text-gray-500">Ensure password has 8+ chars, 1 uppercase, 1 lowercase, 1 number & 1 special char</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-2xl bg-purple-600 px-7 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-purple-700 disabled:opacity-50 transition"
              >
                <Key className="h-4 w-4" />
                <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: PHONE & OTP VERIFICATION */}
      {activeTab === 'phone' && (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Registered Phone Number & 2FA</h2>
            <p className="text-xs text-gray-500">
              Updating your mobile number requires current password confirmation + SMS OTP verification
            </p>
          </div>

          {phoneStep === 'INPUT' ? (
            <form onSubmit={handleRequestPhoneOtp} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">New Mobile Number</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="Enter 10-digit number"
                      className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirm Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={currentPasswordForPhone}
                      onChange={(e) => setCurrentPasswordForPhone(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-2xl bg-purple-600 px-7 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>{loading ? 'Requesting OTP...' : 'Send OTP to New Phone'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhoneOtp} className="space-y-6">
              <div className="rounded-2xl bg-purple-50 p-4 border border-purple-100 text-center space-y-1">
                <p className="text-xs font-bold text-purple-900">Verify OTP for Phone Update</p>
                <p className="text-[11px] text-purple-700">
                  Enter 4-digit SMS OTP code sent to <span className="font-black">+{newPhone.replace(/\D/g, '')}</span>
                </p>
              </div>

              <div className="max-w-xs mx-auto">
                <label className="block text-xs font-bold text-gray-700 mb-2 text-center">4-Digit MSG91 OTP</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter OTP code"
                  className="w-full rounded-2xl border-2 border-purple-200 py-3 text-center text-lg font-black text-gray-900 focus:border-purple-600 focus:outline-none tracking-widest"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPhoneStep('INPUT')}
                  className="text-xs font-bold text-gray-500 hover:text-purple-600"
                >
                  ← Edit Number / Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-2xl bg-purple-600 px-7 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{loading ? 'Verifying OTP...' : 'Verify & Save New Phone'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 4: SECURITY & ACCOUNT DETAILS (READ-ONLY) */}
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
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Login Email</span>
              <p className="text-xs font-bold text-gray-900 truncate">{user?.email || 'admin@foodhub.com'}</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Login Phone</span>
              <p className="text-xs font-bold text-gray-900">{user?.phone || '+917006298795'}</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password</span>
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-gray-900">••••••••</p>
                <button
                  onClick={() => setActiveTab('security')}
                  className="text-[10px] font-bold text-purple-600 hover:underline"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-xs font-bold text-indigo-900">
            <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
            <span>Protected by FoodHub 256-Bit SSL JWT Session Management & MSG91 2FA Gateway</span>
          </div>
        </div>
      )}
    </div>
  );
}
