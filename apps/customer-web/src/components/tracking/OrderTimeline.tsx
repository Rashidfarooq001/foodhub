'use client';

import React from 'react';
import { CheckCircle2, Clock, Bike, Home, Store, ShieldCheck, MapPin } from 'lucide-react';

interface Props {
  currentStatus: string;
}

const STEPS = [
  { id: 'PENDING', label: 'Order Placed', icon: Clock },
  { id: 'ACCEPTED', label: 'Accepted', icon: Store },
  { id: 'PREPARING', label: 'Preparing', icon: Store },
  { id: 'READY_FOR_PICKUP', label: 'Ready', icon: Store },
  { id: 'DRIVER_ASSIGNED', label: 'Rider Assigned', icon: Bike },
  { id: 'ARRIVED_AT_RESTAURANT', label: 'Rider Arrived', icon: MapPin },
  { id: 'PICKED_UP', label: 'Picked Up', icon: Bike },
  { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Bike },
  { id: 'DELIVERED', label: 'Delivered', icon: Home },
];

export const OrderTimeline: React.FC<Props> = ({ currentStatus }) => {
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'ACCEPTED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'READY_FOR_PICKUP':
        return 3;
      case 'DRIVER_ASSIGNED':
        return 4;
      case 'ARRIVED_AT_RESTAURANT':
        return 5;
      case 'PICKED_UP':
        return 6;
      case 'OUT_FOR_DELIVERY':
        return 7;
      case 'DELIVERED':
        return 8;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Live Delivery Progress</h3>

      <div className="relative flex items-center justify-between overflow-x-auto pb-4">
        {/* Progress Bar Background */}
        <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-gray-200" />
        <div
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-orange-600 transition-all duration-500"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {/* Step Nodes */}
        {STEPS.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center min-w-[70px]">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                  isDone
                    ? 'border-orange-600 bg-orange-600 text-white shadow-lg'
                    : 'border-gray-300 bg-white text-gray-400'
                } ${isCurrent ? 'ring-4 ring-orange-200 animate-pulse' : ''}`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={`mt-2 text-[10px] font-bold text-center leading-tight ${
                  isDone ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
