'use client';

import React from 'react';
import { CheckCircle2, Clock, Bike, Home, Store } from 'lucide-react';

interface Props {
  currentStatus: string;
}

const STEPS = [
  { id: 'PENDING', label: 'Order Placed', icon: Clock },
  { id: 'ACCEPTED', label: 'Confirmed by Kitchen', icon: Store },
  { id: 'PREPARING', label: 'Preparing Food', icon: Store },
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
      case 'DRIVER_ASSIGNED':
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="space-y-6">
      <div className="relative flex items-center justify-between">
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
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  isDone
                    ? 'border-orange-600 bg-orange-600 text-white shadow-lg'
                    : 'border-gray-300 bg-white text-gray-400'
                } ${isCurrent ? 'ring-4 ring-orange-200 animate-pulse' : ''}`}
              >
                {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span
                className={`mt-2 text-[11px] font-bold ${
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
