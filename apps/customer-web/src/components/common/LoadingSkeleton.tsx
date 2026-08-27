'use client';

import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 space-y-4">
          <div className="h-44 w-full rounded-2xl bg-gray-200" />
          <div className="h-5 w-3/4 rounded-lg bg-gray-200" />
          <div className="h-4 w-1/2 rounded-lg bg-gray-200" />
          <div className="flex justify-between border-t border-gray-100 pt-3">
            <div className="h-4 w-1/4 rounded bg-gray-200" />
            <div className="h-4 w-1/4 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Failed to load food recommendations',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 rounded-2xl border border-rose-100 bg-rose-50/50">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-xl font-bold">
        !
      </div>
      <h4 className="text-lg font-bold text-gray-900">Something went wrong</h4>
      <p className="max-w-md text-xs text-gray-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{ title?: string; subtitle?: string; actionText?: string; onAction?: () => void }> = ({
  title = 'No items found',
  subtitle = 'Try adjusting your search queries or filters.',
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-500 text-xl font-bold">
        🔍
      </div>
      <h4 className="text-lg font-bold text-gray-900">{title}</h4>
      <p className="max-w-md text-xs text-gray-500">{subtitle}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-700"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
