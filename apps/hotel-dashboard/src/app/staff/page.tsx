'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Users, Loader2, ShieldCheck } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: string;
}

export default function HotelStaffPage() {
  const { user, accessToken } = useHotelAuthStore();
  const restaurantId = user?.restaurantId;

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      if (!restaurantId) {
        setIsLoading(false);
        return;
      }

      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/restaurants/${restaurantId}/delivery-staff`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });

        const list: StaffMember[] = [];

        // Include current merchant user
        if (user) {
          list.push({
            id: user.id || 'owner-1',
            name: user.name || (user as any).restaurantName || 'Restaurant Owner',
            phone: (user as any).phone || 'Owner Account',
            role: user.role || 'RESTAURANT_OWNER',
            status: 'ACTIVE',
          });
        }

        if (res.ok) {
          const data = await res.json();
          const deliveryStaff = Array.isArray(data.staff)
            ? data.staff
            : Array.isArray(data)
              ? data
              : [];
          deliveryStaff.forEach((s: any) => {
            list.push({
              id: s.id,
              name: s.name,
              phone: s.phone,
              role: 'DELIVERY_STAFF',
              status: s.isActive ? s.status || 'AVAILABLE' : 'INACTIVE',
            });
          });
        }

        setStaff(list);
      } catch (err) {
        console.error('Failed to load restaurant staff', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [restaurantId, accessToken, user]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Staff Management ({staff.length})</h1>
          <p className="text-xs text-gray-500">
            Manage kitchen operators, store administrators &amp; dedicated delivery fleet
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center">
          <p className="text-sm font-bold text-gray-400">Loading staff records...</p>
        </div>
      ) : staff.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center space-y-3">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <p className="text-base font-bold text-gray-700">No staff members found</p>
          <p className="text-xs text-gray-400">
            Staff members and delivery fleet operators will be listed here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Assigned Role</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-900">{s.name}</td>
                  <td className="px-6 py-4 text-gray-500">{s.phone}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black text-orange-800">
                      {s.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black ${
                        s.status === 'INACTIVE'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
